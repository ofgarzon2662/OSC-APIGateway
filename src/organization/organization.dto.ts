import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class OrganizationDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9._-]+$/)
  readonly ledgerGroupName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9.@_-]+$/)
  readonly ledgerApiUserId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9._-]+$/)
  readonly artifactSchemaName?: string;
}

export class UserForOrganizationDto {
  id: string;
  name: string;
  username: string;
  email: string;
  roles: string[];
}

export class OrganizationResponseDto {
  id: string;
  name: string;
  description: string;
  ledgerGroupName?: string;
  ledgerApiUserId?: string;
  artifactSchemaName?: string;
  users: UserForOrganizationDto[];
  artifacts: any[];
}
