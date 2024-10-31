// import { Test, TestingModule } from '@nestjs/testing';
// import { UserService } from './user.service';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
// import { UserEntity } from './user.entity';
// import { faker } from '@faker-js/faker/.';

// describe('UserService', () => {
//   let service: UserService;
//   let repository: Repository<UserEntity>;
//   let users: UserEntity[];

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [...TypeOrmTestingConfig()],
//       providers: [UserService],
//     }).compile();

//     service = module.get<UserService>(UserService);
//     repository = module.get<Repository<UserEntity>>(
//       getRepositoryToken(UserEntity),
//     );
//     await seedDatabase();
//   });

//   const seedDatabase = async () => {
//     repository.clear();
//     users = [];
//     for (let i: number = 0; i < 5; i++) {
//       const user: UserEntity = await repository.save({
//         nombre: faker.person.firstName(),
//         email: faker.internet.email(),
//         fechaNacimiento: faker.date.between({
//           from: new Date('1950-01-01'),
//           to: new Date('2000-01-01'),
//         }),
//       });
//       users.push(user);
//     }
//   };

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   // Encontrar todos los users

//   it('findAll debería devolver todos los users', async () => {
//     const users: UserEntity[] = await service.findAll();
//     expect(users).toBeDefined();
//     expect(users).not.toBeNull();
//     expect(users).toHaveLength(users.length);
//   });

//   // Encontrar un user por id

//   it('findOne debería devolver un user por id', async () => {
//     const storedUser: UserEntity = users[0];
//     const user: UserEntity = await service.findOne(storedUser.id);
//     expect(user).toBeDefined();
//     expect(user).not.toBeNull();
//     expect(user.nombre).toEqual(storedUser.nombre);
//     expect(user.email).toEqual(storedUser.email);
//   });

//   // Crear un user

//   it('create debería crear un user', async () => {
//     const newUser: Partial<UserEntity> = {
//       nombre: faker.person.firstName(),
//       email: faker.internet.email(),
//       fechaNacimiento: faker.date.between({
//         from: new Date('1950-01-01'),
//         to: new Date('2000-01-01'),
//       }),
//     };
//     const user: UserEntity = await service.create(newUser as UserEntity);
//     expect(user).toBeDefined();
//     expect(user).not.toBeNull();
//     expect(user.nombre).toEqual(newUser.nombre);
//     expect(user.email).toEqual(newUser.email);
//   });

//   // Arroja una excepción si el email no es válido

//   it('create debería arrojar una excepción si el email no es válido', async () => {
//     const newUser: Partial<UserEntity> = {
//       nombre: faker.person.firstName(),
//       email: 'invalid-email',
//       fechaNacimiento: faker.date.between({
//         from: new Date('1950-01-01'),
//         to: new Date('2000-01-01'),
//       }),
//     };
//     await expect(() =>
//       service.create(newUser as UserEntity),
//     ).rejects.toHaveProperty('message', 'El email proporcionado no es válido');
//   });

//   // Actualizar un user

//   it('update debería actualizar un user', async () => {
//     const storedUser: UserEntity = users[0];
//     const updatedUser: Partial<UserEntity> = {
//       nombre: faker.person.firstName(),
//       email: faker.internet.email(),
//       fechaNacimiento: faker.date.between({
//         from: new Date('1950-01-01'),
//         to: new Date('2000-01-01'),
//       }),
//     };
//     const user: UserEntity = await service.update(
//       storedUser.id,
//       updatedUser as UserEntity,
//     );
//     expect(user).toBeDefined();
//     expect(user).not.toBeNull();
//     expect(user.nombre).toEqual(updatedUser.nombre);
//     expect(user.email).toEqual(updatedUser.email);
//   });

//   // Arroja una excepción si el email no es válido al actualizar un user

//   it('update debería arrojar una excepción si el email no es válido', async () => {
//     const storedUser: UserEntity = users[0];
//     const updatedUser: Partial<UserEntity> = {
//       nombre: faker.person.firstName(),
//       email: 'invalid-email',
//       fechaNacimiento: faker.date.between({
//         from: new Date('1950-01-01'),
//         to: new Date('2000-01-01'),
//       }),
//     };
//     await expect(() =>
//       service.update(storedUser.id, updatedUser as UserEntity),
//     ).rejects.toHaveProperty('message', 'El email proporcionado no es válido');
//   });

//   // Eliminar un user

//   it('delete debería eliminar un user', async () => {
//     const storedUser: UserEntity = users[0];
//     await service.delete(storedUser.id);
//     const user: UserEntity = await repository.findOne({
//       where: { id: storedUser.id },
//     });
//     expect(user).toBeNull();
//   });

//   // Eliminar un user que no existe

//   it('delete debería arrojar una excepción si el user no existe', async () => {
//     await expect(() => service.delete('0')).rejects.toHaveProperty(
//       'message',
//       'El user con el id provisto no existe',
//     );
//   });

//   // Actualizar un user que no existe

//   it('update debería arrojar una excepción si el user no existe', async () => {
//     const updatedUser: Partial<UserEntity> = {
//       nombre: faker.person.firstName(),
//       email: faker.internet.email(),
//       fechaNacimiento: faker.date.between({
//         from: new Date('1950-01-01'),
//         to: new Date('2000-01-01'),
//       }),
//     };
//     await expect(() =>
//       service.update('0', updatedUser as UserEntity),
//     ).rejects.toHaveProperty('message', 'El user con el id provisto no existe');
//   });
// });
