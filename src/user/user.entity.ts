import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  username: string;

  @Column()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  password: string;

  @Column('simple-array')
  roles: string[];

  @ManyToOne(() => OrganizationEntity, { nullable: true })
  @JoinColumn()
  organization: OrganizationEntity;
}
