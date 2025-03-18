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
import { UserService } from '../user/user.service';
import { TokenBlacklistService } from './token-blacklist.service';

// Mock para UserService
class MockUserService {
  findOneForAuth = jest.fn();
  findOne = jest.fn();
}

// Mock para TokenBlacklistService
class MockTokenBlacklistService {
  blacklistToken = jest.fn();
  isBlacklisted = jest.fn().mockReturnValue(false);
  cleanupExpiredTokens = jest.fn();
  getBlacklistSize = jest.fn().mockReturnValue(0);
  onModuleInit = jest.fn();
  onModuleDestroy = jest.fn();
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository: Repository<UserEntity>;
  let passwordService: PasswordService;
  let userService: MockUserService;
  let tokenBlacklistService: MockTokenBlacklistService;
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
        AuthService,
        PasswordService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useClass: MockUserService,
        },
        {
          provide: TokenBlacklistService,
          useClass: MockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    passwordService = module.get<PasswordService>(PasswordService);
    userService = module.get<MockUserService>(UserService);
    tokenBlacklistService = module.get<MockTokenBlacklistService>(TokenBlacklistService);

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
        roles: ['user'], // Add roles field
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
    it('should return user object when credentials are valid', async () => {
      // Configurar el mock de UserService para devolver un usuario
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashedPassword',
        roles: ['user']
      };
      
      userService.findOne.mockResolvedValue(mockUser);
      
      // Spy en el método comparePasswords
      jest.spyOn(passwordService, 'comparePasswords').mockResolvedValue(true);
      
      // Llamar al método a probar
      const result = await service.validateUser('testuser', 'password');
      
      // Verificar que se llamó a findOne con los argumentos correctos
      expect(userService.findOne).toHaveBeenCalledWith('testuser');
      
      // Verificar el resultado
      expect(result).toEqual({
        id: 'user-id',
        username: 'testuser',
        roles: ['user']
      });
    });

    it('should throw an exception when user is not found', async () => {
      userService.findOne.mockRejectedValue(new Error('User not found'));
      await expect(() => service.validateUser('nonexistent', 'password')).rejects.toHaveProperty('message', 'Invalid credentials');
    });

    it('should throw an exception when password is incorrect', async () => {
      userService.findOne.mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        password: 'hashedPassword',
        roles: ['user']
      });
      jest.spyOn(passwordService, 'comparePasswords').mockResolvedValue(false);
      await expect(() => service.validateUser('testuser', 'wrongPassword')).rejects.toHaveProperty('message', 'Invalid credentials');
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

  describe('logout', () => {
    it('should blacklist token and return success message', async () => {
      // Setup
      const token = 'Bearer mock.jwt.token';
      
      // Execute
      const result = await service.logout(token);
      
      // Assert
      expect(tokenBlacklistService.blacklistToken).toHaveBeenCalledWith(token);
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
