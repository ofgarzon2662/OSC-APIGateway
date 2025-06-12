import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Connection, Channel } from 'amqplib';

export interface ArtifactCreatedEvent {
  artifactId: string;
  title: string;
  description: string;
  keywords: string[];
  links: string[];
  dois: string[];
  fundingAgencies: string[];
  acknowledgements: string;
  fileName: string;
  hash: string;
  submitterEmail: string;
  submitterUsername: string;
  submittedAt: string;
  organizationName: string;
  version: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  
  private readonly exchangeName = 'artifact.exchange';
  private readonly artifactCreatedRoutingKey = 'artifact.created';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqHost = this.configService.get<string>('RABBITMQ_HOST', 'localhost');
      const rabbitmqPort = this.configService.get<number>('RABBITMQ_PORT', 5672);
      const rabbitmqUser = this.configService.get<string>('RABBITMQ_USER', 'guest');
      const rabbitmqPass = this.configService.get<string>('RABBITMQ_PASS', 'guest');

      const connectionUrl = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}:${rabbitmqPort}`;
      
      this.connection = (await connect(connectionUrl)) as any;
      this.channel = await (this.connection as any).createChannel();
      
      // Ensure the exchange exists (it should already exist from broker definitions)
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.logger.log('Successfully connected to RabbitMQ');
      
      // Handle connection errors
      (this.connection as any).on('error', (err: any) => {
        this.logger.error('RabbitMQ connection error:', err);
      });
      
      (this.connection as any).on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
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

  async publishArtifactCreated(event: ArtifactCreatedEvent): Promise<void> {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel is not available');
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      const message = JSON.stringify(event);
      const messageBuffer = Buffer.from(message);
      
      const published = this.channel.publish(
        this.exchangeName,
        this.artifactCreatedRoutingKey,
        messageBuffer,
        {
          persistent: true, // Make message persistent
          timestamp: Date.now(),
          messageId: event.artifactId,
        }
      );
      
      if (published) {
        this.logger.log(`Published artifact.created event for artifact: ${event.artifactId}`);
      } else {
        this.logger.warn(`Failed to publish artifact.created event for artifact: ${event.artifactId}`);
        throw new Error('Failed to publish message to RabbitMQ');
      }
      
    } catch (error) {
      this.logger.error('Error publishing artifact.created event:', error);
      throw error;
    }
  }

  // Health check method
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
} 