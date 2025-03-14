import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { PasswordService } from './password.service';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { faker } from '@faker-js/faker';
import { InjectRepository } from '@nestjs/typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository: Repository<UserEntity>;
  let passwordService: PasswordService;
  let userList: UserEntity[];

  // Mock JWT service
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  // Mock config service
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'JWT_SECRET': 'test-secret',
        'JWT_EXPIRES_IN': '1h',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [
        {
          provide: AuthService,
          useFactory: (jwtService, configService, userRepository, passwordService) => {
            return new AuthService(jwtService, configService, userRepository, passwordService);
          },
          inject: [
            JwtService,
            ConfigService,
            getRepositoryToken(UserEntity),
            PasswordService,
          ],
        },
        PasswordService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    passwordService = module.get<PasswordService>(PasswordService);

    await seedDatabase();
  });

  const seedDatabase = async () => {
    await userRepository.clear();
    userList = [];
    
    // Create 5 users for testing
    for (let i = 0; i < 5; i++) {
      const plainPassword = 'Password' + faker.number.int(10000);
      const hashedPassword = await passwordService.hashPassword(plainPassword);
      
      const user = {
        name: faker.person.fullName(),
        username: faker.internet.username() + faker.number.int(10000), // Ensure username is unique and long enough
        email: faker.internet.email(),
        password: hashedPassword,
      };
      
      const savedUser = await userRepository.save(user);
      
      // Store the plain password for testing
      savedUser['plainPassword'] = plainPassword;
      userList.push(savedUser);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return true when credentials are valid', async () => {
      const user = userList[0];
      const result = await service.validateUser(user.username, user['plainPassword']);
      expect(result).toBe(true);
    });

    it('should throw an exception when user is not found', async () => {
      await expect(() => service.validateUser('nonexistent', 'password')).rejects.toHaveProperty('message', 'Invalid credentials');
    });

    it('should throw an exception when password is incorrect', async () => {
      const user = userList[0];
      await expect(() => service.validateUser(user.username, 'wrongPassword')).rejects.toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('login', () => {
    it('should return JWT token when login is successful', async () => {
      // Setup
      const req = {
        user: {
          id: userList[0].id,
          username: userList[0].username,
          roles: ['admin'],
        },
      };

      // Execute
      const result = await service.login(req);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: userList[0].username,
          sub: userList[0].id,
          roles: ['admin'],
        },
        {
          secret: 'test-secret',
        }
      );
    });
  });
});
