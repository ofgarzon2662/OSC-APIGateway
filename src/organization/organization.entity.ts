import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
// We need these type imports for TypeScript type checking
import type { UserEntity } from '../user/user.entity';
import type { ArtifactEntity } from '../artifact/artifact.entity';

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
    (user: any) => user.organization,
    { cascade: true, onDelete: 'CASCADE' },
  )
  users: UserEntity[];

  /* ---------- relación con artefactos ---------- */
  @OneToMany(
    () => require('../artifact/artifact.entity').ArtifactEntity,
    (artifact: any) => artifact.organization,
    { cascade: true, onDelete: 'CASCADE' },
  )
  artifacts: ArtifactEntity[];
}
