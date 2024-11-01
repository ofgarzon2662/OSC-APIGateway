import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @ManyToOne(
    () => OrganizationEntity,
    (organization: OrganizationEntity) => organization.users,
    { onDelete: 'CASCADE' },
  )
  organization: OrganizationEntity;
}
