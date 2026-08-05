/* eslint-disable prettier/prettier */
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../organization/organization.entity';
import { UserEntity } from '../../user/user.entity';
import { ArtifactEntity } from '../../artifact/artifact.entity';
import { WorkflowEntity } from '../../workflow/workflow.entity';

export const TypeOrmTestingConfig = () => [
  TypeOrmModule.forRoot({
    type: 'sqljs',
    autoSave: false,
    dropSchema: true,
    entities: [OrganizationEntity, UserEntity, ArtifactEntity, WorkflowEntity],
    synchronize: true,
    keepConnectionAlive: true,
  }),
  TypeOrmModule.forFeature([
    OrganizationEntity,
    UserEntity,
    ArtifactEntity,
    WorkflowEntity,
  ]),
];
/* archivo src/shared/testing-utils/typeorm-testing-config.ts*/
