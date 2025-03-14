import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { User } from './user';

describe('UserService', () => {
  let service: UserService;
  let configService: ConfigService;
  let userRepository: Repository<UserEntity>;

  // Mock repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  // Mock config values
  const mockConfigValues = {
    'ADMIN1_USERNAME': 'admin',
    'ADMIN1_PASSWORD': 'securePassword123',
    'ADMIN1_ROLES': 'admin',
    'ADMIN2_USERNAME': 'superadmin',
    'ADMIN2_PASSWORD': 'superSecurePassword456',
    'ADMIN2_ROLES': 'admin,pi',
  };

  // Mock config service
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      return mockConfigValues[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loadUsersFromEnv', () => {
    it('should load users from environment variables', () => {
      // This is already called in the constructor, so we can just check the result
      const admin1 = service['users'].find(user => user.username === 'admin');
      const admin2 = service['users'].find(user => user.username === 'superadmin');

      expect(admin1).toBeDefined();
      expect(admin1?.username).toBe('admin');
      expect(admin1?.password).toBe('securePassword123');
      expect(admin1?.roles).toEqual(['admin']);

      expect(admin2).toBeDefined();
      expect(admin2?.username).toBe('superadmin');
      expect(admin2?.password).toBe('superSecurePassword456');
      expect(admin2?.roles).toEqual(['admin', 'pi']);
    });

    it('should handle undefined roles and use defaults', () => {
      // Create a temporary backup of the original values
      const originalRoles1 = mockConfigValues['ADMIN1_ROLES'];
      const originalRoles2 = mockConfigValues['ADMIN2_ROLES'];
      
      // Set roles to undefined for this test
      delete mockConfigValues['ADMIN1_ROLES'];
      delete mockConfigValues['ADMIN2_ROLES'];
      
      // Reset users array and reload
      service['users'] = [];
      service['loadUsersFromEnv']();

      const admin1 = service['users'].find(user => user.username === 'admin');
      expect(admin1).toBeDefined();
      expect(admin1?.roles).toEqual(['admin']);
      
      // Restore the original values
      mockConfigValues['ADMIN1_ROLES'] = originalRoles1;
      mockConfigValues['ADMIN2_ROLES'] = originalRoles2;
    });

    it('should use default users if no environment variables are set', () => {
      // Create a temporary backup
      const originalValues = { ...mockConfigValues };
      
      // Clear all config values
      Object.keys(mockConfigValues).forEach(key => {
        delete mockConfigValues[key];
      });
      
      // Manually call loadUsersFromEnv to reset the users array
      service['users'] = [];
      service['loadUsersFromEnv']();

      expect(service['users'].length).toBe(2);
      expect(service['users'][0].username).toBe('admin');
      expect(service['users'][0].password).toBe('admin');
      expect(service['users'][0].roles).toEqual(['admin']);
      
      expect(service['users'][1].username).toBe('user');
      expect(service['users'][1].password).toBe('admin');
      expect(service['users'][1].roles).toEqual(['admin']);
      
      // Restore the original values
      Object.assign(mockConfigValues, originalValues);
    });
  });

  describe('findOne', () => {
    it('should return a user if found by username', async () => {
      const result = await service.findOne('admin');
      expect(result).toBeDefined();
      expect(result?.username).toBe('admin');
    });

    it('should return undefined if user not found', async () => {
      const result = await service.findOne('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user entity', async () => {
      const userDto = { name: 'Test User', username: 'testuser', email: 'test@example.com' };
      const createdUser = { id: '1', ...userDto };
      
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(userDto);
      
      expect(mockRepository.create).toHaveBeenCalledWith(userDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        { id: '1', name: 'User 1', username: 'user1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', username: 'user2', email: 'user2@example.com' }
      ];
      
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });
});
