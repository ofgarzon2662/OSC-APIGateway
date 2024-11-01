import { UserEntity } from '../user/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ArtifactEntity } from '../artifact/artifact.entity';

@Entity()
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => UserEntity, (user: UserEntity) => user.organization)
  users: UserEntity[];

  @OneToMany(() => ArtifactEntity, (artifact) => artifact.organization)
  artifacts: ArtifactEntity[];
}
