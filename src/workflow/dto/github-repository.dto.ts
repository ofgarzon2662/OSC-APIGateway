import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RepositoryContentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsOptional()
  hash: string;
}

export class GitHubRepositoryDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  gitHash: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepositoryContentDto)
  @IsOptional()
  contents: RepositoryContentDto[];
}
