import { IsEmail, IsNotEmpty, IsString, IsArray, IsEnum, ValidateIf } from 'class-validator';
import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Role } from '../shared/enums/role.enums';

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
  @ValidateIf((object, value) => value !== undefined)
  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @ManyToOne(() => OrganizationEntity, { nullable: true })
  @JoinColumn()
  organization: OrganizationEntity;
}
