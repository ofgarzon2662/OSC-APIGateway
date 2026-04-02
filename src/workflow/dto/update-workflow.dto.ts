import {
  IsString,
  IsArray,
  Length,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GitHubRepositoryDto } from './github-repository.dto';

export class UpdateWorkflowDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GitHubRepositoryDto)
  @IsOptional()
  githubRepositories?: GitHubRepositoryDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  artifactIds?: string[];

  @IsString()
  @IsNotEmpty()
  @Length(20, 1000)
  submission_comment: string;
}
