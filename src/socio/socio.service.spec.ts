import { Test, TestingModule } from '@nestjs/testing';
import { SocioService } from './socio.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { SocioEntity } from './socio.entity';
import { fa, faker } from '@faker-js/faker/.';
import e from 'express';


describe('SocioService', () => {
  let service: SocioService;
  let repository: Repository<SocioEntity>;
  let socios: SocioEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [SocioService],
    }).compile();

    service = module.get<SocioService>(SocioService);
    repository = module.get<Repository<SocioEntity>>(getRepositoryToken(SocioEntity));
    await seedDatabase();
  });

  const seedDatabase = async () => {
    repository.clear();
    socios = [];
    for (let i: number = 0; i < 5; i++) {
      const socio: SocioEntity = await repository.save({
        nombre: faker.person.firstName(),
        email: faker.internet.email(),
        fechaNacimiento: faker.date.between({
          from: new Date('1950-01-01'),
          to: new Date('2000-01-01'),
        }),
      });
      socios.push(socio);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Encontrar todos los socios

  it('findAll debería devolver todos los socios', async () => {
    const socios: SocioEntity[] = await service.findAll();
    expect(socios).toBeDefined();
    expect(socios).not.toBeNull();
    expect(socios).toHaveLength(socios.length);
  });

  // Encontrar un socio por id

  it('findOne debería devolver un socio por id', async () => {
    const storedSocio: SocioEntity = socios[0];
    const socio: SocioEntity = await service.findOne(storedSocio.id);
    expect(socio).toBeDefined();
    expect(socio).not.toBeNull();
    expect(socio.nombre).toEqual(storedSocio.nombre);
    expect(socio.email).toEqual(storedSocio.email);
  });

  // Crear un socio

  it('create debería crear un socio', async () => {
    const newSocio: Partial<SocioEntity> = {
      nombre: faker.person.firstName(),
      email: faker.internet.email(),
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    };
    const socio: SocioEntity = await service.create(newSocio as SocioEntity);
    expect(socio).toBeDefined();
    expect(socio).not.toBeNull();
    expect(socio.nombre).toEqual(newSocio.nombre);
    expect(socio.email).toEqual(newSocio.email);
  });

  // Arroja una excepción si el email no es válido

  it('create debería arrojar una excepción si el email no es válido', async () => {
    const newSocio: Partial<SocioEntity> = {
      nombre: faker.person.firstName(),
      email: "invalid-email",
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    };
    await expect(() => service.create(newSocio as SocioEntity)).rejects.toHaveProperty("message", "El email proporcionado no es válido");
  });

  // Actualizar un socio

  it('update debería actualizar un socio', async () => {
    const storedSocio: SocioEntity = socios[0];
    const updatedSocio: Partial<SocioEntity> = {
      nombre: faker.person.firstName(),
      email: faker.internet.email(),
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    };
    const socio: SocioEntity = await service.update(storedSocio.id, updatedSocio as SocioEntity);
    expect(socio).toBeDefined();
    expect(socio).not.toBeNull();
    expect(socio.nombre).toEqual(updatedSocio.nombre);
    expect(socio.email).toEqual(updatedSocio.email);
  });

  // Arroja una excepción si el email no es válido al actualizar un socio

  it('update debería arrojar una excepción si el email no es válido', async () => {
    const storedSocio: SocioEntity = socios[0];
    const updatedSocio: Partial<SocioEntity> = {
      nombre: faker.person.firstName(),
      email: "invalid-email",
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    };
    await expect(() => service.update(storedSocio.id, updatedSocio as SocioEntity)).rejects.toHaveProperty("message", "El email proporcionado no es válido");
  });

  // Eliminar un socio

  it('delete debería eliminar un socio', async () => {
    const storedSocio: SocioEntity = socios[0];
    await service.delete(storedSocio.id);
    const socio: SocioEntity = await repository.findOne({where: {id: storedSocio.id}});
    expect(socio).toBeNull();
  });

  // Eliminar un socio que no existe

  it('delete debería arrojar una excepción si el socio no existe', async () => {
    await expect(() => service.delete("0")).rejects.toHaveProperty("message", "El socio con el id provisto no existe");
  });

  // Actualizar un socio que no existe

  it('update debería arrojar una excepción si el socio no existe', async () => {
    const updatedSocio: Partial<SocioEntity> = {
      nombre: faker.person.firstName(),
      email: faker.internet.email(),
      fechaNacimiento: faker.date.between({
        from: new Date('1950-01-01'),
        to: new Date('2000-01-01'),
      }),
    };
    await expect(() => service.update("0", updatedSocio as SocioEntity)).rejects.toHaveProperty("message", "El socio con el id provisto no existe");
  });

  








});
