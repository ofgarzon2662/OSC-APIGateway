import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column()
  fechaNacimiento: Date;

  @ManyToMany(
    () => OrganizationEntity,
    (organization: OrganizationEntity) => organization.users,
  )
  organizations: OrganizationEntity[];
}
