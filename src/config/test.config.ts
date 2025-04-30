import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';

export const testConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [UserEntity, OrganizationEntity, ArtifactEntity],
  synchronize: true,
  dropSchema: true,
  logging: false,
}; 