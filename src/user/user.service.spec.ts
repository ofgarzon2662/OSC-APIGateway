import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { faker } from '@faker-js/faker';

describe('OrganizationService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;
  let userList: UserEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await repository.clear();
    userList = [];
    const usersAmount = 50;

    for (let i = 0; i < usersAmount; i++) {
      const user: UserEntity = await repository.save({
        name: faker.person.fullName(),
        username: faker.internet.username(),
        email: faker.internet.email(),
      });

      userList.push(user);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Find all users
  it('findAll should return all users', async () => {
    const users: UserEntity[] = await service.findAll();
    expect(users).toBeDefined();
    expect(users).not.toBeNull();
    expect(users).toHaveLength(userList.length);
  });
  // Get One User
  it('findOne should return one user', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: UserEntity = await service.findOne(userList[randomIndex].id);
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user).toMatchObject({
      id: userList[randomIndex].id,
      name: userList[randomIndex].name,
      username: userList[randomIndex].username,
      email: userList[randomIndex].email,
    });
  });
  // Get non existent user
  it('findOne should throw an exception for a non existent user', async () => {
    await expect(() =>
      service.findOne('non-existent-id'),
    ).rejects.toHaveProperty(
      'message',
      'The user with the provided id does not exist',
    );
  });
  // Create a User
  it('create should create a user', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    const createdUser: UserEntity = await service.create(user as UserEntity);
    expect(createdUser).toBeDefined();
    expect(createdUser).not.toBeNull();
    expect(createdUser).toHaveProperty('id');
    expect(createdUser).toMatchObject(user);
  });
  // Create a User with invalid email
  it('create should throw an exception for an invalid email', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: 'invalid-email',
    };
    await expect(() =>
      service.create(user as UserEntity),
    ).rejects.toHaveProperty('message', 'The email provided is not valid');
  });
  // Create a User with an existing email
  it('create should throw an exception for an existing email', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: userList[randomIndex].email,
    };
    await expect(() =>
      service.create(user as UserEntity),
    ).rejects.toHaveProperty(
      'message',
      'The email or username provided is already in use',
    );
  });

  // Create a User with an existing username
  it('create should throw an exception for an existing username', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: userList[randomIndex].username,
      email: faker.internet.email(),
    };
    await expect(() =>
      service.create(user as UserEntity),
    ).rejects.toHaveProperty(
      'message',
      'The email or username provided is already in use',
    );
  });

  // Update a User
  it('update should update a user', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    const updatedUser: UserEntity = await service.update(
      userList[randomIndex].id,
      user as UserEntity,
    );
    expect(updatedUser).toBeDefined();
    expect(updatedUser).not.toBeNull();
    expect(updatedUser).toMatchObject(user);
  });

  // Update a User with invalid email
  it('update should throw an exception for an invalid email', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: 'invalid-email',
    };
    await expect(() =>
      service.update(userList[randomIndex].id, user as UserEntity),
    ).rejects.toHaveProperty('message', 'The email provided is not valid');
  });
  // Update a non existent user
  it('update should throw an exception for a non existent user', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    await expect(() =>
      service.update('non-existent-id', user as UserEntity),
    ).rejects.toHaveProperty(
      'message',
      'The User with the provided id does not exist',
    );
  });
  // Delete a User
  it('delete should delete a user', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const id = userList[randomIndex].id;
    await service.delete(id);
    const users: UserEntity[] = await service.findAll();
    expect(users).toHaveLength(userList.length - 1);
    // Check that the user was deleted
    await expect(() => service.findOne(id)).rejects.toHaveProperty(
      'message',
      'The user with the provided id does not exist',
    );
  });
  // Delete a non existent user
  it('delete should throw an exception for a non existent user', async () => {
    await expect(() =>
      service.delete('non-existent-id'),
    ).rejects.toHaveProperty(
      'message',
      'The User with the provided id does not exist',
    );
  });
});
