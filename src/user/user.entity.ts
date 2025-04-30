import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import type { OrganizationEntity } from '../organization/organization.entity';   // <- type-only
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
  @ValidateIf((o, v) => v !== undefined)
  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  /* ---------- relación (lado MANY) ---------- */
  @ManyToOne(
    // usamos require para evitar import estático
    () => require('../organization/organization.entity').OrganizationEntity,
    (org: any) => org.users,
    { nullable: true, onDelete: 'CASCADE' },
  )
  @JoinColumn()
  organization: OrganizationEntity | null;
}
