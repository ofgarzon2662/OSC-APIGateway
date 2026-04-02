import {
  IsNotEmpty,
  IsString,
  IsArray,
  Length,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GitHubRepositoryDto } from './github-repository.dto';

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(50, 3000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GitHubRepositoryDto)
  @IsOptional()
  githubRepositories: GitHubRepositoryDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  artifactIds: string[];

  @IsString()
  @IsNotEmpty()
  @Length(20, 1000)
  submission_comment: string;
}
