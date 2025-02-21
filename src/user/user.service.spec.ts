import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { faker } from '@faker-js/faker';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let organizationRepository: Repository<OrganizationEntity>;
  let userList: UserEntity[];
  let org: OrganizationEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    organizationRepository = module.get<Repository<OrganizationEntity>>(
      getRepositoryToken(OrganizationEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await organizationRepository.clear();
    await userRepository.clear();
    userList = [];
    org = await organizationRepository.save({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
    });
    const usersAmount = 50;

    for (let i = 0; i < usersAmount; i++) {
      const user: UserEntity = await userRepository.save({
        name: faker.person.fullName(),
        username: faker.internet.username(),
        email: faker.internet.email(),
        organization: org,
      });

      userList.push(user);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Find all users
  it('findAll should return all users', async () => {
    const users: UserEntity[] = await service.findAll(org.id);
    expect(users).toBeDefined();
    expect(users).not.toBeNull();
    expect(users).toHaveLength(userList.length);
  });

  it('findAll should return no Users for invalid OrgId', async () => {
    await expect(() =>
      service.findAll('invalid-org-id'),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  it('findAll should return no Users for no OrgId', async () => {
    await expect(() => service.findAll('')).rejects.toHaveProperty(
      'message',
      'The organizationId provided is missing',
    );
  });

  it('findAll should return error for non existing Org', async () => {
    await expect(() =>
      service.findAll(faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Get One User
  it('findOne should return one user', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: UserEntity = await service.findOne(
      org.id,
      userList[randomIndex].id,
    );
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
      service.findOne(org.id, 'non-existent-id'),
    ).rejects.toHaveProperty('message', 'The userId provided is not valid');
  });

  // Get a User with an invalid organization
  it('findOne should throw an exception for an invalid organization', async () => {
    await expect(() =>
      service.findOne('invalid-organization-id', faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  // Get a User with a non existent organization
  it('findOne should throw an exception for a non existent organization', async () => {
    await expect(() =>
      service.findOne(faker.string.uuid(), faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Get a User - Non existent User
  it('findOne should throw an exception for a non existent user', async () => {
    await expect(() =>
      service.findOne(org.id, faker.string.uuid()),
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
    const createdUser: UserEntity = await service.create(user, org.id);
    expect(createdUser).toBeDefined();
    expect(createdUser).not.toBeNull();
    expect(createdUser).toHaveProperty('id');
    expect(createdUser).toMatchObject(user);
  });
  // Create a User with non existent organization
  it('create should throw an exception for a non existent organization', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    await expect(() => service.create(user, '')).rejects.toHaveProperty(
      'message',
      'The organizationId provided is missing',
    );
  });
  // Create a User with invalid email
  it('create should throw an exception for an invalid email', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: 'invalid-email',
    };
    await expect(() => service.create(user, org.id)).rejects.toHaveProperty(
      'message',
      'The email provided is not valid',
    );
  });
  // Create a User with an existing email
  it('create should throw an exception for an existing email', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: userList[randomIndex].email,
    };
    await expect(() => service.create(user, org.id)).rejects.toHaveProperty(
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
    await expect(() => service.create(user, org.id)).rejects.toHaveProperty(
      'message',
      'The email or username provided is already in use',
    );
  });

  // Create a User with an non vaild organization
  it('create should throw an exception for an invalid organization', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    await expect(() =>
      service.create(user, 'invalid-organization-id'),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  // create a User with an non existent organization
  it('create should throw an exception for a non existent organization', async () => {
    const user: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    const orgId = faker.string.uuid();
    await expect(() => service.create(user, orgId)).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Update user
  it('update should modify user data', async () => {
    const updatedData: Partial<UserEntity> = {
      name: faker.person.fullName(),
      username: faker.internet.username(),
      email: faker.internet.email(),
    };
    const updatedUser: UserEntity = await service.update(
      userList[0].id,
      updatedData as UserEntity,
    );
    expect(updatedUser).toMatchObject(updatedData);
  });

  it('update should throw an error for invalid email', async () => {
    const updatedData: Partial<UserEntity> = {
      email: 'invalid-email',
    };
    await expect(
      service.update(userList[0].id, updatedData as UserEntity),
    ).rejects.toHaveProperty('message', 'The email provided is not valid');
  });

  it('update should throw an error for non-existent user', async () => {
    const updatedData: Partial<UserEntity> = {
      name: faker.person.fullName(),
    };
    await expect(
      service.update(faker.string.uuid(), updatedData as UserEntity),
    ).rejects.toHaveProperty(
      'message',
      'The User with the provided id does not exist',
    );
  });

  // Update a user with an existing email
  it('update should throw an exception for an email already in use by another user', async () => {
    const [userToUpdate, existingUser] = userList;
    const updatedData: Partial<UserEntity> = {
      email: existingUser.email,
    };

    await expect(
      service.update(userToUpdate.id, updatedData as UserEntity),
    ).rejects.toHaveProperty('message', 'The email provided is already in use');
  });

  // Update a user with an existing username
  it('update should throw an exception for a username already in use by another user', async () => {
    const [userToUpdate, existingUser] = userList;
    const updatedData: Partial<UserEntity> = {
      username: existingUser.username,
    };

    await expect(
      service.update(userToUpdate.id, updatedData as UserEntity),
    ).rejects.toHaveProperty(
      'message',
      'The username provided is already in use',
    );
  });

  // Delete a User
  it('delete should delete a user', async () => {
    const randomIndex = Math.floor(Math.random() * userList.length);
    const id = userList[randomIndex].id;
    await service.delete(id);
    const users: UserEntity[] = await service.findAll(org.id);
    expect(users).toHaveLength(userList.length - 1);
    // Check that the user was deleted
    await expect(() => service.findOne(org.id, id)).rejects.toHaveProperty(
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

  // Delete all users
  it('deleteAll should remove all users from an organization', async () => {
    await service.deleteAll(org.id);
    const users: UserEntity[] = await service.findAll(org.id);
    expect(users).toHaveLength(0);
  });

  // Delete all users with invalid organization ID
  it('deleteAll should throw an exception for an invalid organization ID', async () => {
    await expect(() =>
      service.deleteAll('invalid-organization-id'),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  // Delete all users with missing organization ID
  it('deleteAll should throw an exception for a missing organization ID', async () => {
    await expect(() => service.deleteAll('')).rejects.toHaveProperty(
      'message',
      'The organizationId provided is missing',
    );
  });

  // Delete all users with a non-existent organization
  it('deleteAll should throw an exception for a non-existent organization', async () => {
    await expect(() =>
      service.deleteAll(faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });
});
