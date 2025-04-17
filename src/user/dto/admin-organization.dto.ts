import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AdminOrganizationDto {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  username: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  email: string;

  @Expose()
  roles: string[];

  @Expose()
  organization: {
    id: string;
    name: string;
    description: string;
  };
} 