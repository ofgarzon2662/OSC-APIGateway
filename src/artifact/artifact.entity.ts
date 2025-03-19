import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ArtifactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  contributor: string;

  @Column()
  description: string;

  // Add a column for the Submission Date
  @Column()
  submittedAt: Date;

  @Column({ type: 'text' })
  body: any;

  // Add a cloumn for an array of keywords, all strings
  @Column({ type: 'simple-array' })
  keywords: string[];

  // Add a column for an array of links, all must be urls
  @Column({ type: 'simple-array' })
  links: string[];

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.artifacts,
    { onDelete: 'CASCADE' },
  )
  organization: OrganizationEntity;
}
