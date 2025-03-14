import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { faker } from '@faker-js/faker';
import { UserCreateDto } from './userCreate.dto';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../auth/password.service';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;
  let userList: UserEntity[];
  let configService: ConfigService;
  let passwordService: PasswordService;

  // Mock config service
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'ADMIN1_USERNAME': 'admin',
        'ADMIN1_PASSWORD': 'securePassword123',
        'ADMIN1_ROLES': 'admin',
        'ADMIN2_USERNAME': 'superadmin',
        'ADMIN2_PASSWORD': 'superSecurePassword456',
        'ADMIN2_ROLES': 'admin,pi',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [
        UserService,
        PasswordService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    configService = module.get<ConfigService>(ConfigService);
    passwordService = module.get<PasswordService>(PasswordService);
    
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await repository.clear();
    userList = [];
    
    // Create 5 users for testing
    for (let i = 0; i < 5; i++) {
      const user = {
        name: faker.person.fullName(),
        username: faker.internet.username() + faker.number.int(10000), // Ensure username is unique and long enough
        email: faker.internet.email(),
        password: await passwordService.hashPassword('Password' + faker.number.int(10000)), // Ensure password is long enough
      };
      
      const savedUser = await repository.save(user);
      userList.push(savedUser);
    }
  };

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
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await service.findAll();
      expect(users).toBeDefined();
      expect(users).not.toBeNull();
      expect(users.length).toBeGreaterThanOrEqual(userList.length);
    });
  });

  describe('findOne', () => {
    it('should return a user by username', async () => {
      const storedUser = userList[0];
      const user = await service.findOne(storedUser.username);
      expect(user).toBeDefined();
      expect(user.username).toEqual(storedUser.username);
    });

    it('should return a user by email', async () => {
      const storedUser = userList[0];
      const user = await service.findOne(storedUser.email);
      expect(user).toBeDefined();
      expect(user.email).toEqual(storedUser.email);
    });

    it('should throw an exception for a non-existent user', async () => {
      await expect(() => service.findOne('nonexistent')).rejects.toHaveProperty('message', 'User not found');
    });
  });

  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'newusername' + faker.number.int(10000),
        email: faker.internet.email(),
        password: 'Password' + faker.number.int(10000),
      };

      const result = await service.create(newUser);
      
      expect(result).toBeDefined();
      expect(result.username).toEqual(newUser.username);
      expect(result.email).toEqual(newUser.email);
      
      // Verify it was added to the database
      const storedUser = await repository.findOne({ 
        where: { username: newUser.username } 
      });
      expect(storedUser).toBeDefined();
    });

    it('should throw an exception for a username that already exists', async () => {
      const existingUser = userList[0];
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: existingUser.username,
        email: faker.internet.email(),
        password: 'Password' + faker.number.int(10000),
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Username or email already exists');
    });

    it('should throw an exception for an email that already exists', async () => {
      const existingUser = userList[0];
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'newusername' + faker.number.int(10000),
        email: existingUser.email,
        password: 'Password' + faker.number.int(10000),
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Username or email already exists');
    });

    it('should throw an exception for a password that is too short', async () => {
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'newusername' + faker.number.int(10000),
        email: faker.internet.email(),
        password: 'short',
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Password must be at least 8 characters long');
    });

    it('should throw an exception for a username that is too short', async () => {
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'short',
        email: faker.internet.email(),
        password: 'Password' + faker.number.int(10000),
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Username must be at least 8 characters long');
    });
  });
});
