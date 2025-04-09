import { IsString } from 'class-validator';

export class GetOrganizationDto {
  @IsString()
  name: string;
} 