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

  it('findAll should return all organizations', async () => {
    const organizations: OrganizationEntity[] = await service.findAll();
    expect(organizations).toBeDefined();
    expect(organizations).not.toBeNull();
    expect(organizations).toHaveLength(organizationsList.length);
  });

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
      description: 'Test Organization',
      users: [],
    };

    const newOrganization: OrganizationEntity = await service.create(
      organization as OrganizationEntity,
    );

    expect(newOrganization).toBeDefined();
    expect(newOrganization.name).toEqual(organization.name);
    expect(newOrganization.description).toEqual(organization.description);
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

//   // Test Modify Organization

//   it('modify should return a modified Organization', async () => {
//     const storedOrganization: OrganizationEntity = organizationsList[0];
//     const modifiedOrganization: Partial<OrganizationEntity> = {
//       nombre: faker.company.name(),
//       fechaFundacion: faker.date.between({
//         from: new Date('2020-01-01'),
//         to: new Date('2024-01-01'),
//       }),
//       imagen: `https://www.${faker.internet.domainName()}`,
//       descripcion: 'Organization de prueba',
//       users: [],
//     };

//     const organization: OrganizationEntity = await service.update(
//       storedOrganization.id,
//       modifiedOrganization as OrganizationEntity,
//     );
//     expect(organization).not.toBeNull();
//     expect(organization.nombre).toEqual(modifiedOrganization.nombre);
//     expect(organization.descripcion).toEqual(modifiedOrganization.descripcion);
//     expect(organization.imagen).toEqual(modifiedOrganization.imagen);
//     expect(organization.fechaFundacion).toEqual(
//       modifiedOrganization.fechaFundacion,
//     );
//   });

//   // Test Delete Organization

//   it('delete should remove a Organization', async () => {
//     const storedOrganization: OrganizationEntity = organizationsList[0];
//     await service.delete(storedOrganization.id);
//     const organization: OrganizationEntity = await repository.findOne({
//       where: { id: storedOrganization.id },
//     });
//     expect(organization).toBeNull();
//   });

//   // Lanza Excepción al crear organization con mas de 100 caracteres en descripcion

//   it('create should throw an exception for a Organization with a description longer than 100 characters', async () => {
//     const organization: Partial<OrganizationEntity> = {
//       nombre: faker.company.name(),
//       fechaFundacion: faker.date.between({
//         from: new Date('2020-01-01'),
//         to: new Date('2024-01-01'),
//       }),
//       imagen: `https://www.${faker.internet.domainName()}`,
//       descripcion: faker.lorem.paragraphs(5),
//       users: [],
//     };

//     await expect(() =>
//       service.create(organization as OrganizationEntity),
//     ).rejects.toHaveProperty(
//       'message',
//       'La descripción no puede tener más de 100 caracteres',
//     );
//   });

//   // Lanza Excepción al modificar organization con mas de 100 caracteres en descripcion

//   it('modify should throw an exception for a Organization with a description longer than 100 characters', async () => {
//     const storedOrganization: OrganizationEntity = organizationsList[0];
//     const modifiedOrganization: Partial<OrganizationEntity> = {
//       nombre: faker.company.name(),
//       fechaFundacion: faker.date.between({
//         from: new Date('2020-01-01'),
//         to: new Date('2024-01-01'),
//       }),
//       imagen: `https://www.${faker.internet.domainName()}`,
//       descripcion: faker.lorem.paragraphs(5),
//       users: [],
//     };

//     await expect(() =>
//       service.update(
//         storedOrganization.id,
//         modifiedOrganization as OrganizationEntity,
//       ),
//     ).rejects.toHaveProperty(
//       'message',
//       'La descripción no puede tener más de 100 caracteres',
//     );
//   });
// });
