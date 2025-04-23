import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { UserEntity }      from '../user/user.entity';          // <- type-only
import type { ArtifactEntity }  from '../artifact/artifact.entity';  // <- type-only

@Entity()
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  /* ---------- relación con usuarios ---------- */
  @OneToMany(
    () => require('../user/user.entity').UserEntity,
    (user: UserEntity) => user.organization,
    { cascade: true, onDelete: 'CASCADE' },
  )
  users: UserEntity[];

  /* ---------- relación con artefactos ---------- */
  @OneToMany(
    () => require('../artifact/artifact.entity').ArtifactEntity,
    (artifact: ArtifactEntity) => artifact.organization,
    { cascade: true, onDelete: 'CASCADE' },
  )
  artifacts: ArtifactEntity[];
}
