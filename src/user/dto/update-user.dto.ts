import { IsString, IsEmail, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Role } from '../../shared/enums/role.enums';
import { OrganizationEntity } from '../../organization/organization.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  organization?: OrganizationEntity;
} 