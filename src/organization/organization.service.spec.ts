import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { OrganizationService } from './organization.service';
import { OrganizationEntity } from './organization.entity';
import { faker } from '@faker-js/faker';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: Repository<OrganizationEntity>;
  let organizationsList: OrganizationEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [OrganizationService],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    repository = module.get<Repository<OrganizationEntity>>(
      getRepositoryToken(OrganizationEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await repository.clear();
    organizationsList = [];

    const organization: OrganizationEntity = await repository.save({
      name: faker.company.name(),
      description: faker.lorem.sentence(),
    });

    organizationsList.push(organization);
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Find all organizations

  it('findAll should return all organizations', async () => {
    const organizations: OrganizationEntity[] = await service.findAll();
    expect(organizations).toBeDefined();
    expect(organizations).not.toBeNull();
    expect(organizations).toHaveLength(organizationsList.length);
  });

  it('findAll should throw an exception for an empty database', async () => {
    await repository.clear();
    await expect(() => service.findAll()).rejects.toHaveProperty(
      'message',
      'There are no organizations in the database',
    );
  });

  // Throw an exception if there is more than one organization in the database

  it('findAll should throw an exception if there is more than one organization in the database', async () => {
    await repository.save({
      name: faker.company.name(),
      description: faker.lorem.sentence(),
    });

    await expect(() => service.findAll()).rejects.toHaveProperty(
      'message',
      'There is more than one organization in the database. This should not happen',
    );
  });

  // Find one organization

  it('findOne should return a Organization by id', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    const organization: OrganizationEntity = await service.findOne(
      storedOrganization.id,
    );
    expect(organization).not.toBeNull();
    expect(organization.name).toEqual(storedOrganization.name);
    expect(organization.description).toEqual(storedOrganization.description);
  });

  it('findOne should throw an exception for an invalid Organization', async () => {
    await expect(() => service.findOne('0')).rejects.toHaveProperty(
      'message',
      'The organization with the provided id does not exist',
    );
  });

  // Create a new organization

  it('create should not return a new Organization', async () => {
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: 'Test Organization',
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'There is already an organization in the database. There can only be one.',
    );

    const organizations: OrganizationEntity[] = await service.findAll();
    expect(organizations).toHaveLength(1);
  });

  // Create an organization with invalid data
  it('create should throw an exception when creating an organization with invalid data', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: faker.lorem.sentences(300),
      users: [],
    };

    await expect(() =>
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The description cannot be longer than 250 characters',
    );
  });

  // Delete the organization

  it('should delete an organization and ensure the list is empty, and then recreates it', async () => {
    await service.delete(organizationsList[0].id);

    // Check that the organization was deleted
    const organizationsInDb = await repository.find();
    expect(organizationsInDb.length).toBe(0);

    // Attempt to delete the organization again

    await expect(
      service.delete(organizationsList[0].id),
    ).rejects.toHaveProperty(
      'message',
      'The organization with the provided id does not exist',
    );

    // Create a new organization
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      // add a description with at least 20 characters
      description: faker.lorem.words(20),
      users: [],
    };

    const newOrganization: OrganizationEntity = await service.create(
      organization as OrganizationEntity,
    );

    expect(newOrganization).toBeDefined();
    expect(newOrganization.name).toEqual(organization.name);
    expect(newOrganization.description).toEqual(organization.description);
  });

  // Create an organization with description exceeding max length
  it('create should throw an exception when creating an organization with a description longer than 250 characters', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: faker.lorem.words(300), // Exceeds 250 characters
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The description cannot be longer than 250 characters',
    );
  });

  // Create an organization with a name shorter than 4 characters
  it('create should throw an exception when creating an organization with a name shorter than 4 characters', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: 'Org', // Less than 4 characters
      description: 'Valid description with more than 20 characters.',
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The name of the organization is required and must have at least 4 characters',
    );
  });

  // Create an organization with a description shorter than 20 characters
  it('create should throw an exception when creating an organization with a description shorter than 20 characters', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: 'Too short', // Less than 20 characters
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The description is required and must be at least 20 characters long',
    );
  });

  // Create an organization with an empty name
  it('create should throw an exception when creating an organization with an empty name', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: '',
      description: 'Valid description with more than 20 characters.',
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The name of the organization is required and must have at least 4 characters',
    );
  });

  // Create an organization with an empty description
  it('create should throw an exception when creating an organization with an empty description', async () => {
    await service.delete(organizationsList[0].id);
    const organization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: '',
      users: [],
    };

    await expect(
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The description is required and must be at least 20 characters long',
    );
  });

  // Update the organization
  it('should update an organization', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    const modifiedOrganization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: 'Test Organization',
      users: [],
    };

    const organization: OrganizationEntity = await service.update(
      storedOrganization.id,
      modifiedOrganization as OrganizationEntity,
    );

    expect(organization).toBeDefined();
    expect(organization.name).toEqual(modifiedOrganization.name);
    expect(organization.description).toEqual(modifiedOrganization.description);
  });

  // Update the organization with invalid data
  it('should throw an exception when updating an organization with invalid data', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    const modifiedOrganization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: faker.lorem.sentences(300),
      users: [],
    };

    await expect(() =>
      service.update(
        storedOrganization.id,
        modifiedOrganization as OrganizationEntity,
      ),
    ).rejects.toHaveProperty(
      'message',
      'The description cannot be longer than 250 characters',
    );
  });

  // Update non existent organization
  it('should throw an exception when updating a non-existent organization', async () => {
    const modifiedOrganization: Partial<OrganizationEntity> = {
      name: faker.company.name(),
      description: 'Test Organization',
      users: [],
    };

    await expect(() =>
      service.update('0', modifiedOrganization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'The organization with the provided id does not exist',
    );
  });
});
