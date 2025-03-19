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
import { UserGetDto } from './userGet.dto';

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

  // Mock config service sin usuarios definidos
  const mockEmptyConfigService = {
    get: jest.fn().mockReturnValue(undefined),
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
    it('should save admin users to the database', async () => {
      // Asegurarnos de que no hay usuarios admin en la base de datos
      await repository.delete({ username: 'admin' });
      await repository.delete({ username: 'superadmin' });
      
      // Llamar al método directamente
      await service.loadUsersFromEnv();
      
      // Verificar directamente en la base de datos que los usuarios se han guardado
      const adminUser = await repository.findOne({ where: { username: 'admin' } });
      const superadminUser = await repository.findOne({ where: { username: 'superadmin' } });
      
      // Verificar que existen
      expect(adminUser).toBeDefined();
      expect(superadminUser).toBeDefined();
      
      // Verificar propiedades del usuario admin
      expect(adminUser.name).toBe('admin');
      expect(adminUser.email).toBe('admin@admin.com');
      expect(adminUser.roles).toEqual(['admin']);
      
      // Verificar propiedades del usuario superadmin
      expect(superadminUser.name).toBe('superadmin');
      expect(superadminUser.email).toBe('superadmin@admin.com');
      expect(superadminUser.roles).toEqual(['admin', 'pi']);
    });
    
    // Test para cubrir el caso en que ya existen los usuarios admin
    it('should handle case when admin users already exist', async () => {
      // Silenciar los logs para esta prueba
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      try {
        // Crear un usuario admin manualmente
        const adminUser = {
          name: 'admin',
          username: 'admin',
          email: 'admin@admin.com',
          password: await passwordService.hashPassword('existingPassword'),
          roles: ['admin']
        };
        await repository.save(adminUser);
        
        // Llamar al método
        await service.loadUsersFromEnv();
        
        // Verificar que se llamó a console.log
        expect(console.log).toHaveBeenCalledWith('Admin user admin already exists in database');
        
        // Verificar que el usuario sigue existiendo (no se ha borrado ni modificado)
        const existingUser = await repository.findOne({ where: { username: 'admin' } });
        expect(existingUser).toBeDefined();
        expect(existingUser.password).toBe(adminUser.password); // Verificar que la contraseña no cambió
      } finally {
        // Restaurar console.log
        console.log = originalConsoleLog;
      }
    });
    
    // Test para cubrir el caso de error al guardar usuario
    it('should handle database errors gracefully', async () => {
      // Crear un mock de repositorio que lance error al llamar a findOne
      const mockRepository = {
        findOne: jest.fn().mockImplementation(() => {
          throw new Error('Database connection error');
        }),
        save: jest.fn(),
        create: jest.fn().mockReturnValue({}),
        delete: jest.fn(),
        find: jest.fn(),
        count: jest.fn(),
        clear: jest.fn(),
      };
      
      // Silenciar los console.error para esta prueba
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        // Crear una instancia de servicio con el mock
        const moduleRef = await Test.createTestingModule({
          providers: [
            UserService,
            PasswordService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
            {
              provide: getRepositoryToken(UserEntity),
              useValue: mockRepository,
            }
          ],
        }).compile();
        
        const serviceWithMockedRepo = moduleRef.get<UserService>(UserService);
        
        // Verificar que no lanza error
        await expect(serviceWithMockedRepo.loadUsersFromEnv()).resolves.not.toThrow();
        
        // Verificar que se llamó a console.error
        expect(console.error).toHaveBeenCalled();
      } finally {
        // Restaurar console.error
        console.error = originalConsoleError;
      }
    });
    
    // Test para cubrir el caso en que no hay variables de entorno definidas
    it('should use default users when no environment variables are defined', async () => {
      // Silenciar la advertencia en console
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();
      
      try {
        // Crear un servicio con un ConfigService vacío
        const moduleRef = await Test.createTestingModule({
          imports: [...TypeOrmTestingConfig()],
          providers: [
            UserService,
            PasswordService,
            {
              provide: ConfigService,
              useValue: mockEmptyConfigService,
            }
          ],
        }).compile();
        
        const serviceWithEmptyConfig = moduleRef.get<UserService>(UserService);
        const repo = moduleRef.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        
        // Limpiar la base de datos
        await repo.clear();
        
        // Llamar al método
        await serviceWithEmptyConfig.loadUsersFromEnv();
        
        // Verificar que se llamó a console.warn
        expect(console.warn).toHaveBeenCalledWith('No users found in environment variables. Using default users.');
        
        // Verificar que se guardaron los usuarios por defecto
        const adminUser = await repo.findOne({ where: { username: 'admin' } });
        const userUser = await repo.findOne({ where: { username: 'user' } });
        
        expect(adminUser).toBeDefined();
        expect(userUser).toBeDefined();
      } finally {
        // Restaurar console.warn
        console.warn = originalConsoleWarn;
      }
    });
  });

  describe('getOne', () => {
    it('should return a user DTO by username', async () => {
      const storedUser = userList[0];
      const result = await service.getOne(storedUser.username);
      
      expect(result).toBeDefined();
      expect(result.username).toEqual(storedUser.username);
      expect(result).toBeInstanceOf(UserGetDto);
      // Verificar que el objeto no contiene la propiedad password
      expect((result as any).password).toBeUndefined();
    });
    
    it('should throw an exception for a non-existent user', async () => {
      await expect(() => service.getOne('nonexistent')).rejects.toHaveProperty('message', 'User not found');
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
        role: 'collaborator'
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
        role: 'collaborator'
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
        role: 'collaborator'
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Username or email already exists');
    });

    it('should throw an exception for a password that is too short', async () => {
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'newusername' + faker.number.int(10000),
        email: faker.internet.email(),
        password: 'short',
        role: 'collaborator'
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Password must be at least 8 characters long');
    });

    it('should throw an exception for a username that is too short', async () => {
      const newUser: UserCreateDto = {
        name: faker.person.fullName(),
        username: 'short',
        email: faker.internet.email(),
        password: 'Password' + faker.number.int(10000),
        role: 'collaborator'
      };
      
      await expect(() => service.create(newUser)).rejects.toHaveProperty('message', 'Username must be at least 8 characters long');
    });
  });

  describe('deleteAll', () => {
    it('should delete all users from the database', async () => {
      // Verificar que hay usuarios en la base de datos antes de eliminarlos
      const usersBeforeDelete = await repository.find();
      expect(usersBeforeDelete.length).toBeGreaterThan(0);
      
      // Llamar a deleteAll
      await service.deleteAll();
      
      // Verificar que no quedan usuarios en la base de datos
      const usersAfterDelete = await repository.find();
      expect(usersAfterDelete.length).toBe(0);
    });
    
    it('should work even if there are no users in the database', async () => {
      // Limpiar la base de datos manualmente
      await repository.clear();
      
      // Verificar que no hay usuarios
      const usersBeforeDelete = await repository.find();
      expect(usersBeforeDelete.length).toBe(0);
      
      // Llamar a deleteAll no debería lanzar errores
      await expect(service.deleteAll()).resolves.not.toThrow();
      
      // Verificar que sigue sin haber usuarios
      const usersAfterDelete = await repository.find();
      expect(usersAfterDelete.length).toBe(0);
    });
    
    it('should handle database errors gracefully', async () => {
      // Crear un mock de repositorio que lance error al llamar a delete
      const mockRepository = {
        delete: jest.fn().mockImplementation(() => {
          throw new Error('Database connection error on delete');
        }),
        find: jest.fn().mockReturnValue([]),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        clear: jest.fn(),
        count: jest.fn(),
      };
      
      // Crear una instancia de servicio con el mock
      const moduleRef = await Test.createTestingModule({
        providers: [
          UserService,
          PasswordService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: mockRepository,
          }
        ],
      }).compile();
      
      const serviceWithMockedRepo = moduleRef.get<UserService>(UserService);
      
      // Llamar a deleteAll debería rechazar la promesa con un error
      await expect(serviceWithMockedRepo.deleteAll()).rejects.toThrow('Database connection error on delete');
      
      // Verificar que se llamó al método delete
      expect(mockRepository.delete).toHaveBeenCalledWith({});
    });
  });
});
