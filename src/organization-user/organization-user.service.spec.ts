import { Test, TestingModule } from '@nestjs/testing';
import { ClubSocioService } from './club-socio.service';
import { Repository } from 'typeorm';
import { ClubEntity } from '../club/club.entity';
import { SocioEntity } from '../socio/socio.entity';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { faker } from '@faker-js/faker';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ClubSocioService', () => {
    let service: ClubSocioService;
    let socioRepository: Repository<SocioEntity>;
    let clubRepository: Repository<ClubEntity>;
    let socios: SocioEntity[];
    let club: ClubEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          imports: [...TypeOrmTestingConfig()],
          providers: [ClubSocioService],
        }).compile();
        service = module.get<ClubSocioService>(
            ClubSocioService,
        );
        clubRepository = module.get<Repository<ClubEntity>>(
          getRepositoryToken(ClubEntity),
        );
        socioRepository = module.get<Repository<SocioEntity>>(
          getRepositoryToken(SocioEntity),
        );
        await seedDatabase();
      });

      const seedDatabase = async () => {
        socioRepository.clear();
        clubRepository.clear();
        socios = [];
        for (let i: number = 0; i < 5; i++) {
          const socio: SocioEntity  = await socioRepository.save({
            nombre: faker.person.firstName(),
            email: faker.internet.email(),
            fechaNacimiento: faker.date.between({
                from: new Date('1950-01-01'),
                to: new Date('2000-01-01'),
                }),
          });
          socios.push(socio);
        }
        club = await clubRepository.save({
          nombre: faker.company.name(),
          descripcion: faker.lorem.sentences(3),
          fechaFundacion: faker.date.between({
            from: new Date('2020-01-01'),
            to: new Date('2024-01-01'),
          }),
          imagen: `https://www.${faker.internet.domainName()}`,
          socios: socios,
        });
      };

        it('should be defined', () => {
            expect(service).toBeDefined();
        });


        // Asociar un socio a un club

        it('addSocio debería asociar un socio a un club', async () => {
            const club: ClubEntity = await clubRepository.save({
                nombre: faker.company.name(),
                descripcion: faker.lorem.sentences(3),
                fechaFundacion: faker.date.between({
                    from: new Date('2020-01-01'),
                    to: new Date('2024-01-01'),
                    }),
                imagen: `https://www.${faker.internet.domainName()}`,
              });
                const socio: SocioEntity = await socioRepository.save({
                    nombre: faker.person.firstName(),
                    email: faker.internet.email(),
                    fechaNacimiento: faker.date.between({
                        from: new Date('1950-01-01'),
                        to: new Date('2000-01-01'),
                        }),
                });
                const result: ClubEntity = await service.addMemberToClub(
                    club.id,
                    socio.id,
                );
                expect(result).not.toBeNull();
                expect(result.nombre).toBe(club.nombre);
                expect(result.descripcion).toBe(club.descripcion);
                expect(result.fechaFundacion).toStrictEqual(club.fechaFundacion);
                expect(result.imagen).toBe(club.imagen);
                expect(result.socios.length).toBe(1);
                expect(result.socios[0]).not.toBeNull();
                expect(result.socios[0].nombre).toBe(socio.nombre);
                expect(result.socios[0].email).toBe(socio.email);
                expect(result.socios[0].fechaNacimiento).toStrictEqual(socio.fechaNacimiento);
            
            });


            // Arrojar excepcion con un club que no existe

            it('addSocio debería arrojar una excepción con un socio que no existe', async () => {
                await expect(() =>
                  service.addMemberToClub('0', socios[0].id),
                ).rejects.toHaveProperty(
                  'message',
                  'El Club con el id dado no fue encontrado',
                );
              });

            // Arrojar excepcion con un socio que no existe

            it('addSocio debería arrojar una excepción con un socio que no existe', async () => {
                await expect(() =>
                  service.addMemberToClub(club.id, '0'),
                ).rejects.toHaveProperty(
                  'message',
                  'El Socio con el id dado no fue encontrado',
                );
              });
      

            // Encontrar un socio en un club
            
            it('findMemberFromClub debería encontrar un socio en un club', async () => {
                const socio: SocioEntity = await service.findMemberFromClub(club.id, socios[0].id);
                expect(socio).not.toBeNull();
                expect(socio.nombre).toBe(socios[0].nombre);
                expect(socio.email).toBe(socios[0].email);
                expect(socio.fechaNacimiento).toStrictEqual(socios[0].fechaNacimiento);
              });

            // Arrojar excepcion con un club que no existe

            it('findMemberFromClub debería arrojar una excepción con un club que no existe', async () => {
                await expect(() =>
                  service.findMemberFromClub('0', socios[0].id),
                ).rejects.toHaveProperty(
                  'message',
                  'El Club con el id dado no fue encontrado',
                );
              });

            // Arrojar excepcion con un socio que no existe

            it('findMemberFromClub debería arrojar una excepción con un socio que no existe', async () => {
                await expect(() =>
                  service.findMemberFromClub(club.id, '0'),
                ).rejects.toHaveProperty(
                  'message',
                  'El Socio con el id dado no fue encontrado',
                );
              });

            // Encontrar miembros de un club

            it('findMembersFromClub debería encontrar los miembros de un club', async () => {
                const socios: SocioEntity[] = await service.findMembersFromClub(club.id);
                expect(socios).not.toBeNull();
                expect(socios.length).toBe(5);
              });

            // Arrojar excepcion con un club que no existe

            it('findMembersFromClub debería arrojar una excepción con un club que no existe', async () => {
                await expect(() =>
                  service.findMembersFromClub('0'),
                ).rejects.toHaveProperty(
                  'message',
                  'El Club con el id dado no fue encontrado',
                );
              });

            // Eliminar un socio de un club

            it('deleteMemberFromClub debería eliminar un socio de un club', async () => {
                await service.deleteMemberFromClub(club.id, socios[0].id);
                const clubSocios: SocioEntity[] = await service.findMembersFromClub(club.id);
                expect(clubSocios.length).toBe(4);
              });

            // Arrojar excepcion con un club que no existe

            it('deleteMemberFromClub debería arrojar una excepción con un club que no existe', async () => {
                await expect(() =>
                  service.deleteMemberFromClub('0', socios[0].id),
                ).rejects.toHaveProperty(
                  'message',
                  'El Club con el id dado no fue encontrado',
                );
              });

            // Actualizar miembros de un club

            it('updateMembersFromClub debería actualizar los miembros de un club', async () => {
                const newSocios: SocioEntity[] = [];
                for (let i: number = 0; i < 5; i++) {
                  const socio: SocioEntity = await socioRepository.save({
                    nombre: faker.person.firstName(),
                    email: faker.internet.email(),
                    fechaNacimiento: faker.date.between({
                        from: new Date('1950-01-01'),
                        to: new Date('2000-01-01'),
                        }),
                  });
                  newSocios.push(socio);
                }
                const updatedClub: ClubEntity = await service.updateMembersFromClub(
                  club.id,
                  newSocios,
                );
                expect(updatedClub).not.toBeNull();
                expect(updatedClub.socios.length).toBe(5);
                for (let i: number = 0; i < 5; i++) {
                  expect(updatedClub.socios[i]).not.toBeNull();
                  expect(updatedClub.socios[i].nombre).toBe(newSocios[i].nombre);
                  expect(updatedClub.socios[i].email).toBe(newSocios[i].email);
                  expect(updatedClub.socios[i].fechaNacimiento).toStrictEqual(newSocios[i].fechaNacimiento);
                }
              });
            
    });