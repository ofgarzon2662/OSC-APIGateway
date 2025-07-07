import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService, ArtifactCreatedEvent } from './rabbitmq.service';
import * as amqplib from 'amqplib';
import { LoggerService } from '@nestjs/common';

// Mock amqplib
jest.mock('amqplib');
const mockedAmqplib = amqplib as jest.Mocked<typeof amqplib>;

class SilentLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {}
  error(message: any, ...optionalParams: any[]) {}
  warn(message: any, ...optionalParams: any[]) {}
  debug?(message: any, ...optionalParams: any[]) {}
  verbose?(message: any, ...optionalParams: any[]) {}
}

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;

  const mockChannel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockReturnValue(true),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (mockedAmqplib.connect as jest.Mock).mockResolvedValue(mockConnection as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                RABBITMQ_HOST: 'localhost',
                RABBITMQ_PORT: 5672,
                RABBITMQ_USER: 'guest',
                RABBITMQ_PASS: 'guest',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    })
    .setLogger(new SilentLogger()) // Disable logging for tests
    .compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Fake timers are now enabled only in the specific tests that need them.
  });
  
  // No longer using fake timers globally
  // afterEach(() => {
  //   jest.useRealTimers();
  // });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call connect on module init', async () => {
      const connectSpy = jest.spyOn(service as any, 'connect');
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      connectSpy.mockRestore();
    });
  });
  
  describe('onModuleDestroy', () => {
    it('should call disconnect on module destroy', async () => {
      await (service as any).connect(); // connect first
      const disconnectSpy = jest.spyOn(service as any, 'disconnect');
      await service.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
      disconnectSpy.mockRestore();
    });
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      await (service as any).connect();
      expect(mockedAmqplib.connect).toHaveBeenCalledWith('amqp://guest:guest@localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('artifact.exchange', 'topic', { durable: true });
      expect(service.isConnected()).toBe(true);
    });

    it('should not attempt to connect if already connecting', async () => {
      (service as any).isConnecting = true;
      await (service as any).connect();
      expect(mockedAmqplib.connect).not.toHaveBeenCalled();
    });
    
    it('should handle connection failure and trigger reconnection', async () => {
        const error = new Error('Connection failed');
        (mockedAmqplib.connect as jest.Mock).mockRejectedValueOnce(error);
        const handleConnectionLossSpy = jest.spyOn(service as any, 'handleConnectionLoss').mockImplementation(() => {});

        await (service as any).connect();
        
        expect(handleConnectionLossSpy).toHaveBeenCalled();
        expect(service.isConnected()).toBe(false);
        handleConnectionLossSpy.mockRestore();
    });
  });
  
  describe('handleConnectionLoss', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt to reconnect if max attempts not reached', () => {
        const connectSpy = jest.spyOn(service as any, 'connect').mockResolvedValue(undefined);
        (service as any).reconnectAttempts = 0;
        
        (service as any).handleConnectionLoss();
        
        expect((service as any).connection).toBeNull();
        expect((service as any).channel).toBeNull();
        expect((service as any).isConnecting).toBe(false);
        expect((service as any).reconnectAttempts).toBe(1);
        
        jest.advanceTimersByTime(5000);
        
        expect(connectSpy).toHaveBeenCalled();
        connectSpy.mockRestore();
    });

    it('should not attempt to reconnect if max attempts reached', () => {
        const connectSpy = jest.spyOn(service as any, 'connect');
        (service as any).reconnectAttempts = 10;
        
        (service as any).handleConnectionLoss();
        
        expect((service as any).reconnectAttempts).toBe(10); // Should not increment
        
        jest.advanceTimersByTime(5000);
        
        expect(connectSpy).not.toHaveBeenCalled();
        connectSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should close the channel and connection', async () => {
        await (service as any).connect(); // First connect to have something to close
        await (service as any).disconnect();
        expect(mockChannel.close).toHaveBeenCalled();
        expect(mockConnection.close).toHaveBeenCalled();
        expect(service.isConnected()).toBe(false);
    });
    
    it('should handle errors during disconnection gracefully', async () => {
      await (service as any).connect();
      mockChannel.close.mockRejectedValueOnce(new Error('Channel close error'));
      
      // We expect no exception to be thrown
      await expect((service as any).disconnect()).resolves.not.toThrow();
      // The connection should NOT be closed if the channel fails to close,
      // as the error is caught and logged.
      expect(mockConnection.close).not.toHaveBeenCalled();
    });
  });
  
  describe('publishArtifactCreated', () => {
    const event: ArtifactCreatedEvent = {
        artifactId: '123',
        title: 'Test Artifact',
        description: 'A test description',
        keywords: ['test'],
        links: [],
        dois: [],
        fundingAgencies: [],
        acknowledgements: '',
        fileName: 'test.zip',
        hash: 'abc',
        submitterEmail: 'test@test.com',
        submitterUsername: 'testuser',
        submittedAt: new Date().toISOString(),
        organizationName: 'Test Org',
        version: '1',
    };
    
    it('should publish an event successfully', async () => {
        await (service as any).connect();
        await service.publishArtifactCreated(event);
        
        expect(mockChannel.publish).toHaveBeenCalledWith(
            'artifact.exchange',
            'artifact.created',
            expect.any(Buffer),
            expect.objectContaining({
                persistent: true,
                messageId: event.artifactId,
            }),
        );
    });
    
    it('should throw an error if ensureConnection fails', async () => {
        // This spy needs to be persistent for all retries within publishArtifactCreated
        const ensureConnectionSpy = jest.spyOn(service as any, 'ensureConnection').mockRejectedValue(new Error('Connection error'));
        await expect(service.publishArtifactCreated(event)).rejects.toThrow('Connection error');
        ensureConnectionSpy.mockRestore();
    }, 10000); // Increase timeout for this test
    
    it('should throw error after max retries', async () => {
        await (service as any).connect();

        const publishError = new Error('Failed to publish');
        mockChannel.publish.mockImplementation(() => {
            throw publishError;
        });
        
        await expect(service.publishArtifactCreated(event)).rejects.toThrow(publishError);
        expect(mockChannel.publish).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for this test

    it('should successfully publish after one failure', async () => {
      await (service as any).connect();
  
      // Simulate failure on the first attempt, then success
      mockChannel.publish
        .mockImplementationOnce(() => { throw new Error('Publish error'); })
        .mockReturnValue(true);
  
      await service.publishArtifactCreated(event);
  
      // It should be called twice: once for the failure, once for the success
      expect(mockChannel.publish).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout for this test
  });
  
  describe('isConnected', () => {
    it('should return true when connected', async () => {
        await (service as any).connect();
        expect(service.isConnected()).toBe(true);
    });

    it('should return false when not connected', () => {
        expect(service.isConnected()).toBe(false);
    });

    it('should return false when connecting', async () => {
        (service as any).isConnecting = true;
        // The real connect() method returns early if isConnecting is true.
        await (service as any).connect();
        expect(service.isConnected()).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return the current connection status', () => {
        const status = service.getConnectionStatus();
        expect(status).toEqual({
            connected: false,
            reconnectAttempts: 0,
            isConnecting: false,
        });
    });
  });
  
  describe('ensureConnection', () => {
    it('should call connect if not connected', async () => {
        const connectSpy = jest.spyOn(service as any, 'connect').mockResolvedValue(undefined);
        (service as any).connection = null;
        
        // This will call connect, but since connect is mocked to resolve immediately
        // and isConnected will still be false, it will wait.
        // We need to make isConnected return true after connect is called.
        connectSpy.mockImplementation(async () => {
          (service as any).connection = mockConnection;
          (service as any).channel = mockChannel;
        });

        await (service as any).ensureConnection();
        
        expect(connectSpy).toHaveBeenCalled();
        connectSpy.mockRestore();
    });
  });

  describe('Connection and Channel event handlers', () => {
    it('should handle connection "error" event', async () => {
      const handleSpy = jest.spyOn(service as any, 'handleConnectionLoss').mockImplementation(() => {});
      await (service as any).connect();
      const errorCallback = mockConnection.on.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback(new Error('Connection error'));
      expect(handleSpy).toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('should handle connection "close" event', async () => {
      const handleSpy = jest.spyOn(service as any, 'handleConnectionLoss').mockImplementation(() => {});
      await (service as any).connect();
      const closeCallback = mockConnection.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback();
      expect(handleSpy).toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('should handle channel "error" event', async () => {
      const handleSpy = jest.spyOn(service as any, 'handleConnectionLoss').mockImplementation(() => {});
      await (service as any).connect();
      const errorCallback = mockChannel.on.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback(new Error('Channel error'));
      expect(handleSpy).toHaveBeenCalled();
      handleSpy.mockRestore();
    });

    it('should handle channel "close" event', async () => {
      const handleSpy = jest.spyOn(service as any, 'handleConnectionLoss').mockImplementation(() => {});
      await (service as any).connect();
      const closeCallback = mockChannel.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback();
      expect(handleSpy).toHaveBeenCalled();
      handleSpy.mockRestore();
    });
  });
}); 