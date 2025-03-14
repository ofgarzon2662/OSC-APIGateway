import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { User } from '../user/user';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  // Mock user
  const mockUser = new User(1, 'admin', 'securePassword123', ['admin']);
  
  // Mock user service
  const mockUserService = {
    findOne: jest.fn().mockImplementation((username: string) => {
      if (username === 'admin') {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(undefined);
    }),
  };

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

  // Mock repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
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

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object without password when credentials are valid', async () => {
      const result = await service.validateUser('admin', 'securePassword123');
      expect(result).toBeDefined();
      expect(result.username).toBe('admin');
      expect(result.password).toBeUndefined();
    });

    it('should return null when username is not found', async () => {
      const result = await service.validateUser('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const result = await service.validateUser('admin', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token when login is successful', async () => {
      const req = {
        user: {
          id: 1,
          username: 'admin',
          roles: ['admin'],
        },
      };

      const result = await service.login(req);
      
      expect(result).toBeDefined();
      expect(result.token).toBe('mock.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: 'admin',
          sub: 1,
          roles: ['admin'],
        },
        {
          secret: 'test-secret',
        }
      );
    });
  });
});
