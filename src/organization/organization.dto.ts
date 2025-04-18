import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class OrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(250)
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
