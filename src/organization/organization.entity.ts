import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';
import { WorkflowEntity } from '../workflow/workflow.entity';

@Entity()
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  /* ---------- relación con usuarios ---------- */
  @OneToMany(() => UserEntity, (user) => user.organization, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  users: UserEntity[];

  /* ---------- relación con artefactos ---------- */
  @OneToMany(() => ArtifactEntity, (artifact) => artifact.organization, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  artifacts: ArtifactEntity[];

  /* ---------- relación con workflows ---------- */
  @OneToMany(() => WorkflowEntity, (workflow) => workflow.organization, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  workflows: WorkflowEntity[];
}
