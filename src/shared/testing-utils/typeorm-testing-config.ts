/* eslint-disable prettier/prettier */
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../organization/organization.entity';
import { UserEntity } from '../../user/user.entity';

export const TypeOrmTestingConfig = () => [
 TypeOrmModule.forRoot({
   type: 'sqlite',
   database: ':memory:',
   dropSchema: true,
   entities: [
    OrganizationEntity, 
    UserEntity,
  ],
   synchronize: true,
   keepConnectionAlive: true
 }),
 TypeOrmModule.forFeature([
  OrganizationEntity, 
  UserEntity,
]),
];
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/