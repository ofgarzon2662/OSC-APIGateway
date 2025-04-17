import { IsString, IsEmail, MinLength, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../shared/enums/role.enums';
import { OrganizationEntity } from '../../organization/organization.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(8)
  name: string;

  @IsString()
  @MinLength(8)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsOptional()
  organization?: OrganizationEntity;
} 