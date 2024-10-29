import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationUserService } from './organization-user.service';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { UserEntity } from '../user/user.entity';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { faker } from '@faker-js/faker';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('OrganizationUserService', () => {
  let service: OrganizationUserService;
  let userRepository: Repository<UserEntity>;
  let organizationRepository: Repository<OrganizationEntity>;
  let users: UserEntity[];
  let organization: OrganizationEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [OrganizationUserService],
    }).compile();
    service = module.get<OrganizationUserService>(OrganizationUserService);
    organizationRepository = module.get<Repository<OrganizationEntity>>(
      getRepositoryToken(OrganizationEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    userRepository.clear();
    organizationRepository.clear();
    users = [];
    for (let i: number = 0; i < 5; i++) {
      const user: UserEntity = await userRepository.save({
        nombre: faker.person.firstName(),
        email: faker.internet.email(),
        fechaNacimiento: faker.date.between({
          from: new Date('1950-01-01'),
          to: new Date('2000-01-01'),
        }),
      });
      users.push(user);
    }
    organization = await organizationRepository.save({
      nombre: faker.company.name(),
      descripcion: faker.lorem.sentences(3),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
      users: users,
    });
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Asociar un user a un organization

  it('addUser debería asociar un user a un organization', async () => {
    const organization: OrganizationEntity = await organizationRepository.save({
      nombre: faker.company.name(),
      descripcion: faker.lorem.sentences(3),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: `https://www.${faker.internet.domainName()}`,
    });
    const user: UserEntity = await userRepository.save({
      nombre: faker.person.firstName(),
      email: faker.internet.email(),
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    });
    const result: OrganizationEntity = await service.addMemberToOrganization(
      organization.id,
      user.id,
    );
    expect(result).not.toBeNull();
    expect(result.nombre).toBe(organization.nombre);
    expect(result.descripcion).toBe(organization.descripcion);
    expect(result.fechaFundacion).toStrictEqual(organization.fechaFundacion);
    expect(result.imagen).toBe(organization.imagen);
    expect(result.users.length).toBe(1);
    expect(result.users[0]).not.toBeNull();
    expect(result.users[0].nombre).toBe(user.nombre);
    expect(result.users[0].email).toBe(user.email);
    expect(result.users[0].fechaNacimiento).toStrictEqual(user.fechaNacimiento);
  });

  // Arrojar excepcion con un organization que no existe

  it('addUser debería arrojar una excepción con un user que no existe', async () => {
    await expect(() =>
      service.addMemberToOrganization('0', users[0].id),
    ).rejects.toHaveProperty(
      'message',
      'El Organization con el id dado no fue encontrado',
    );
  });

  // Arrojar excepcion con un user que no existe

  it('addUser debería arrojar una excepción con un user que no existe', async () => {
    await expect(() =>
      service.addMemberToOrganization(organization.id, '0'),
    ).rejects.toHaveProperty(
      'message',
      'El User con el id dado no fue encontrado',
    );
  });

  // Encontrar un user en un organization

  it('findMemberFromOrganization debería encontrar un user en un organization', async () => {
    const user: UserEntity = await service.findMemberFromOrganization(
      organization.id,
      users[0].id,
    );
    expect(user).not.toBeNull();
    expect(user.nombre).toBe(users[0].nombre);
    expect(user.email).toBe(users[0].email);
    expect(user.fechaNacimiento).toStrictEqual(users[0].fechaNacimiento);
  });

  // Arrojar excepcion con un organization que no existe

  it('findMemberFromOrganization debería arrojar una excepción con un organization que no existe', async () => {
    await expect(() =>
      service.findMemberFromOrganization('0', users[0].id),
    ).rejects.toHaveProperty(
      'message',
      'El Organization con el id dado no fue encontrado',
    );
  });

  // Arrojar excepcion con un user que no existe

  it('findMemberFromOrganization debería arrojar una excepción con un user que no existe', async () => {
    await expect(() =>
      service.findMemberFromOrganization(organization.id, '0'),
    ).rejects.toHaveProperty(
      'message',
      'El User con el id dado no fue encontrado',
    );
  });

  // Encontrar miembros de un organization

  it('findMembersFromOrganization debería encontrar los miembros de un organization', async () => {
    const users: UserEntity[] = await service.findMembersFromOrganization(
      organization.id,
    );
    expect(users).not.toBeNull();
    expect(users.length).toBe(5);
  });

  // Arrojar excepcion con un organization que no existe

  it('findMembersFromOrganization debería arrojar una excepción con un organization que no existe', async () => {
    await expect(() =>
      service.findMembersFromOrganization('0'),
    ).rejects.toHaveProperty(
      'message',
      'El Organization con el id dado no fue encontrado',
    );
  });

  // Eliminar un user de un organization

  it('deleteMemberFromOrganization debería eliminar un user de un organization', async () => {
    await service.deleteMemberFromOrganization(organization.id, users[0].id);
    const organizationUsers: UserEntity[] =
      await service.findMembersFromOrganization(organization.id);
    expect(organizationUsers.length).toBe(4);
  });

  // Arrojar excepcion con un organization que no existe

  it('deleteMemberFromOrganization debería arrojar una excepción con un organization que no existe', async () => {
    await expect(() =>
      service.deleteMemberFromOrganization('0', users[0].id),
    ).rejects.toHaveProperty(
      'message',
      'El Organization con el id dado no fue encontrado',
    );
  });

  // Actualizar miembros de un organization

  it('updateMembersFromOrganization debería actualizar los miembros de un organization', async () => {
    const newUsers: UserEntity[] = [];
    for (let i: number = 0; i < 5; i++) {
      const user: UserEntity = await userRepository.save({
        nombre: faker.person.firstName(),
        email: faker.internet.email(),
        fechaNacimiento: faker.date.between({
          from: new Date('1950-01-01'),
          to: new Date('2000-01-01'),
        }),
      });
      newUsers.push(user);
    }
    const updatedOrganization: OrganizationEntity =
      await service.updateMembersFromOrganization(organization.id, newUsers);
    expect(updatedOrganization).not.toBeNull();
    expect(updatedOrganization.users.length).toBe(5);
    for (let i: number = 0; i < 5; i++) {
      expect(updatedOrganization.users[i]).not.toBeNull();
      expect(updatedOrganization.users[i].nombre).toBe(newUsers[i].nombre);
      expect(updatedOrganization.users[i].email).toBe(newUsers[i].email);
      expect(updatedOrganization.users[i].fechaNacimiento).toStrictEqual(
        newUsers[i].fechaNacimiento,
      );
    }
  });
});
