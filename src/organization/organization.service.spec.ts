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
    repository.clear();
    organizationsList = [];
    for (let i = 0; i < 5; i++) {
      const organization: OrganizationEntity = await repository.save({
        nombre: faker.company.name(),
        fechaFundacion: faker.date.between({
          from: new Date('2020-01-01'),
          to: new Date('2024-01-01'),
        }),
        imagen: faker.image.url(),
        descripcion: faker.lorem.sentence(),
      });
      organizationsList.push(organization);
    }
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
    expect(organization.nombre).toEqual(storedOrganization.nombre);
    expect(organization.descripcion).toEqual(storedOrganization.descripcion);
    expect(organization.imagen).toEqual(storedOrganization.imagen);
    expect(organization.fechaFundacion).toEqual(
      storedOrganization.fechaFundacion,
    );
  });

  it('findOne should throw an exception for an invalid Organization', async () => {
    await expect(() => service.findOne('0')).rejects.toHaveProperty(
      'message',
      'El organization con el id provisto no existe',
    );
  });

  it('create should return a new Organization', async () => {
    const organization: Partial<OrganizationEntity> = {
      nombre: faker.company.name(),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
      descripcion: 'Organization de prueba',
      users: [],
    };

    const newOrganization: OrganizationEntity = await service.create(
      organization as OrganizationEntity,
    );
    expect(newOrganization).not.toBeNull();

    const storedOrganization: OrganizationEntity = await repository.findOne({
      where: { id: newOrganization.id },
    });
    expect(storedOrganization).not.toBeNull();
    expect(storedOrganization.nombre).toEqual(newOrganization.nombre);
    expect(storedOrganization.descripcion).toEqual(newOrganization.descripcion);
    expect(storedOrganization.imagen).toEqual(newOrganization.imagen);
    expect(storedOrganization.fechaFundacion).toEqual(
      newOrganization.fechaFundacion,
    );
  });

  // Test Modify Organization

  it('modify should return a modified Organization', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    const modifiedOrganization: Partial<OrganizationEntity> = {
      nombre: faker.company.name(),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
      descripcion: 'Organization de prueba',
      users: [],
    };

    const organization: OrganizationEntity = await service.update(
      storedOrganization.id,
      modifiedOrganization as OrganizationEntity,
    );
    expect(organization).not.toBeNull();
    expect(organization.nombre).toEqual(modifiedOrganization.nombre);
    expect(organization.descripcion).toEqual(modifiedOrganization.descripcion);
    expect(organization.imagen).toEqual(modifiedOrganization.imagen);
    expect(organization.fechaFundacion).toEqual(
      modifiedOrganization.fechaFundacion,
    );
  });

  // Test Delete Organization

  it('delete should remove a Organization', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    await service.delete(storedOrganization.id);
    const organization: OrganizationEntity = await repository.findOne({
      where: { id: storedOrganization.id },
    });
    expect(organization).toBeNull();
  });

  // Lanza Excepción al crear organization con mas de 100 caracteres en descripcion

  it('create should throw an exception for a Organization with a description longer than 100 characters', async () => {
    const organization: Partial<OrganizationEntity> = {
      nombre: faker.company.name(),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
      descripcion: faker.lorem.paragraphs(5),
      users: [],
    };

    await expect(() =>
      service.create(organization as OrganizationEntity),
    ).rejects.toHaveProperty(
      'message',
      'La descripción no puede tener más de 100 caracteres',
    );
  });

  // Lanza Excepción al modificar organization con mas de 100 caracteres en descripcion

  it('modify should throw an exception for a Organization with a description longer than 100 characters', async () => {
    const storedOrganization: OrganizationEntity = organizationsList[0];
    const modifiedOrganization: Partial<OrganizationEntity> = {
      nombre: faker.company.name(),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
      descripcion: faker.lorem.paragraphs(5),
      users: [],
    };

    await expect(() =>
      service.update(
        storedOrganization.id,
        modifiedOrganization as OrganizationEntity,
      ),
    ).rejects.toHaveProperty(
      'message',
      'La descripción no puede tener más de 100 caracteres',
    );
  });
});
