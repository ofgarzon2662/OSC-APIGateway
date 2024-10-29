/* eslint-disable prettier/prettier */
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubEntity } from '../../club/club.entity';
import { SocioEntity } from '../../socio/socio.entity';


export const TypeOrmTestingConfig = () => [
 TypeOrmModule.forRoot({
   type: 'sqlite',
   database: ':memory:',
   dropSchema: true,
   entities: [
    ClubEntity, 
    SocioEntity,
  ],
   synchronize: true,
   keepConnectionAlive: true
 }),
 TypeOrmModule.forFeature([
  ClubEntity, 
  SocioEntity,
]),
];
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/