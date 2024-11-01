import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ArtifactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  body: any;

  @Column()
  timeStamp: Date;

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.artifacts,
    { onDelete: 'CASCADE' },
  )
  organization: OrganizationEntity;
}
