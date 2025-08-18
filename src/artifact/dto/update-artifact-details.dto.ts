import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateArtifactDto } from './create-artifact.dto';

// DTO for PI / Collaborator updates: all fields optional except id,title,description which are not included
export class UpdateArtifactDetailsDto extends OmitType(
  PartialType(CreateArtifactDto),
  ['title', 'description'] as const,
) {}
