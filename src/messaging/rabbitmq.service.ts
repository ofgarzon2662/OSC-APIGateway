import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Connection, Channel } from 'amqplib';
import { ManifestItem } from 'src/artifact/artifact.entity';



export interface ArtifactUpdatedEvent {
  artifactId: string;
  keywords?: string[];
  footprint?: string;
  links?: string[];
  dois?: string[];
  fundingAgencies?: string[];
  acknowledgements?: string;
  manifest?: ManifestItem[];
  verified?: boolean;
  lastTimeVerified?: string | null;
  lastTimeUpdated: string;
  version: string;
}

// Command sent when an artifact is ready to be submitted downstream
export interface ArtifactSubmitCommand {
  artifactId: string;
  manifest: ManifestItem[];
  title: string;
  footprint: string;
  description?: string;
  keywords?: string[];
  links?: string[];
  dois?: string[];
  fundingAgencies?: string[];
  acknowledgements?: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000; // 5 seconds
  
  private readonly exchangeName = 'artifact.exchange';
  private readonly artifactUpdatedRoutingKey = 'artifact.updated';
  private readonly artifactSubmitRoutingKey = 'artifact.submit';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) {
      this.logger.log('Connection attempt already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const rabbitmqHost = this.configService.get<string>('RABBITMQ_HOST', 'localhost');
      const rabbitmqPort = this.configService.get<number>('RABBITMQ_PORT', 5672);
      const rabbitmqUser = this.configService.get<string>('RABBITMQ_USER', 'guest');
      const rabbitmqPass = this.configService.get<string>('RABBITMQ_PASS', 'guest');

      const connectionUrl = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}:${rabbitmqPort}`;
      
      this.logger.log(`Attempting to connect to RabbitMQ at ${rabbitmqHost}:${rabbitmqPort}`);
      
      this.connection = (await connect(connectionUrl)) as any;
      this.channel = await (this.connection as any).createChannel();
      
      // Ensure the exchange exists (it should already exist from broker definitions)
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.logger.log('Successfully connected to RabbitMQ');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Handle connection errors and implement reconnection
      (this.connection as any).on('error', (err: any) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.handleConnectionLoss();
      });
      
      (this.connection as any).on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.handleConnectionLoss();
      });

      // Handle channel errors
      this.channel.on('error', (err: any) => {
        this.logger.error('RabbitMQ channel error:', err);
        this.handleConnectionLoss();
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
        this.handleConnectionLoss();
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.handleConnectionLoss();
    } finally {
      this.isConnecting = false;
    }
  }

  private handleConnectionLoss(): void {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(`Attempting to reconnect to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          this.logger.error('Reconnection attempt failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      this.logger.error('Max reconnection attempts reached. Manual intervention required.');
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected() && !this.isConnecting) {
      this.logger.log('Connection lost, attempting to reconnect...');
      await this.connect();
    }

    // Wait for connection to be established
    let attempts = 0;
    const maxWaitAttempts = 10;
    while (!this.isConnected() && attempts < maxWaitAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!this.isConnected()) {
      throw new Error('Unable to establish RabbitMQ connection');
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishArtifactUpdated(event: ArtifactUpdatedEvent): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.ensureConnection();

        if (!this.channel) throw new Error('RabbitMQ channel is not available');

        const messageBuffer = Buffer.from(JSON.stringify(event));

        const published = this.channel.publish(
          this.exchangeName,
          this.artifactUpdatedRoutingKey,
          messageBuffer,
          {
            persistent: true,
            timestamp: Date.now(),
            messageId: event.artifactId,
          },
        );

        if (published) {
          this.logger.log(`Published artifact.updated event for artifact: ${event.artifactId}`);
          return;
        }
        throw new Error('Failed to publish message to RabbitMQ');
      } catch (error) {
        retryCount++;
        this.logger.error(`Error publishing artifact.updated event (attempt ${retryCount}/${maxRetries}):`, error);
        if (retryCount >= maxRetries) throw error;
        this.connection = null;
        this.channel = null;
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  async publishArtifactSubmit(cmd: ArtifactSubmitCommand): Promise<void> {
    const maxRetries = 3;
    let retry = 0;
    while (retry < maxRetries) {
      try {
        await this.ensureConnection();
        if (!this.channel) throw new Error('RabbitMQ channel is not available');

        const buffer = Buffer.from(JSON.stringify(cmd));
        const ok = this.channel.publish(
          this.exchangeName,
          this.artifactSubmitRoutingKey,
          buffer,
          { persistent: true, contentType: 'application/json', messageId: cmd.artifactId },
        );
        if (ok) {
          this.logger.log(`Published artifact.submit command for artifact ${cmd.artifactId}`);
          return;
        }
        throw new Error('Failed to publish message');
      } catch (err) {
        retry++;
        this.logger.error(`artifact.submit publish error (${retry}/3)`, err);
        if (retry >= maxRetries) throw err;
        this.connection = null; this.channel = null;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // Health check method
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null && !this.isConnecting;
  }

  // Get connection status for debugging
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number; isConnecting: boolean } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting,
    };
  }
} 