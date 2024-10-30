import { OrganizationEntity } from 'src/organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ArtifactEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'jsonb' })
  body: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timeStamp: Date;

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.artifacts,
    { onDelete: 'CASCADE' },
  )
  organization: OrganizationEntity;
}
