import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class OrganizationDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;
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
  users: UserForOrganizationDto[];
  artifacts: any[];
}
