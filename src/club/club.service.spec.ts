import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { ClubService } from './club.service';
import { ClubEntity } from './club.entity';
import { faker } from '@faker-js/faker';


describe('ClubService', () => {
  let service: ClubService;
  let repository: Repository<ClubEntity>;
  let clubsList: ClubEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [ClubService],
    }).compile();

    service = module.get<ClubService>(ClubService);
    repository = module.get<Repository<ClubEntity>>(getRepositoryToken(ClubEntity));
    await seedDatabase();
  });

  
const seedDatabase = async () => {
  repository.clear();
  clubsList = [];
  for(let i = 0; i < 5; i++){
      const club: ClubEntity = await repository.save({
      nombre: faker.company.name(),
      fechaFundacion: faker.date.between({
        from: new Date('2020-01-01'),
        to: new Date('2024-01-01'),
      }),
      imagen: faker.image.url(),
      descripcion: faker.lorem.sentence()
      });
      clubsList.push(club);
  }
};



it('should be defined', () => {
  expect(service).toBeDefined();
});


it('findAll should return all clubs', async () => {
  const clubs: ClubEntity[] = await service.findAll();
  expect(clubs).toBeDefined();
  expect(clubs).not.toBeNull();
  expect(clubs).toHaveLength(clubsList.length);
});

it('findOne should return a Club by id', async () => {
  const storedClub: ClubEntity = clubsList[0];
  const club: ClubEntity = await service.findOne(storedClub.id);
  expect(club).not.toBeNull();
  expect(club.nombre).toEqual(storedClub.nombre)
  expect(club.descripcion).toEqual(storedClub.descripcion)
  expect(club.imagen).toEqual(storedClub.imagen)
  expect(club.fechaFundacion).toEqual(storedClub.fechaFundacion)
});

it('findOne should throw an exception for an invalid Club', async () => {
  await expect(() => service.findOne("0")).rejects.toHaveProperty("message", "El club con el id provisto no existe")
});



it('create should return a new Club', async () => {
  const club: Partial<ClubEntity> = {
    nombre: faker.company.name(),
    fechaFundacion: faker.date.between({
      from: new Date('2020-01-01'),
      to: new Date('2024-01-01'),
    }),
    imagen: `https://www.${faker.internet.domainName()}`,
    descripcion: "Club de prueba",
    socios: [],
  }


  const newClub: ClubEntity = await service.create(club as ClubEntity);
  expect(newClub).not.toBeNull();

  const storedClub: ClubEntity = await repository.findOne({where: {id: newClub.id}})
  expect(storedClub).not.toBeNull();
  expect(storedClub.nombre).toEqual(newClub.nombre)
  expect(storedClub.descripcion).toEqual(newClub.descripcion)
  expect(storedClub.imagen).toEqual(newClub.imagen)
  expect(storedClub.fechaFundacion).toEqual(newClub.fechaFundacion)

});

// Test Modify Club

it('modify should return a modified Club', async () => {
  const storedClub: ClubEntity = clubsList[0];
  const modifiedClub: Partial<ClubEntity> = {
    nombre: faker.company.name(),
    fechaFundacion: faker.date.between({
      from: new Date('2020-01-01'),
      to: new Date('2024-01-01'),
    }),
    imagen: `https://www.${faker.internet.domainName()}`,
    descripcion: "Club de prueba",
    socios: [],
  }

  const club: ClubEntity = await service.update(storedClub.id, modifiedClub as ClubEntity);
  expect(club).not.toBeNull();
  expect(club.nombre).toEqual(modifiedClub.nombre)
  expect(club.descripcion).toEqual(modifiedClub.descripcion)
  expect(club.imagen).toEqual(modifiedClub.imagen)
  expect(club.fechaFundacion).toEqual(modifiedClub.fechaFundacion)

});

// Test Delete Club

it('delete should remove a Club', async () => {
  const storedClub: ClubEntity = clubsList[0];
  await service.delete(storedClub.id);
  const club: ClubEntity = await repository.findOne({where: {id: storedClub.id}})
  expect(club).toBeNull();
});

// Lanza Excepción al crear club con mas de 100 caracteres en descripcion

it('create should throw an exception for a Club with a description longer than 100 characters', async () => {
  const club: Partial<ClubEntity> = {
    nombre: faker.company.name(),
    fechaFundacion: faker.date.between({
      from: new Date('2020-01-01'),
      to: new Date('2024-01-01'),
    }),
    imagen: `https://www.${faker.internet.domainName()}`,
    descripcion: faker.lorem.paragraphs(5),
    socios: [],
  }

  await expect(() => service.create(club as ClubEntity)).rejects.toHaveProperty("message", "La descripción no puede tener más de 100 caracteres")


});

// Lanza Excepción al modificar club con mas de 100 caracteres en descripcion

it('modify should throw an exception for a Club with a description longer than 100 characters', async () => {
  const storedClub: ClubEntity = clubsList[0];
  const modifiedClub: Partial<ClubEntity> = {
    nombre: faker.company.name(),
    fechaFundacion: faker.date.between({
      from: new Date('2020-01-01'),
      to: new Date('2024-01-01'),
    }),
    imagen: `https://www.${faker.internet.domainName()}`,
    descripcion: faker.lorem.paragraphs(5),
    socios: [],
  }

  await expect(() => service.update(storedClub.id, modifiedClub as ClubEntity)).rejects.toHaveProperty("message", "La descripción no puede tener más de 100 caracteres")

});

});