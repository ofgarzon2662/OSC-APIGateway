import { ManifestItem } from '../artifact.entity';
import { SubmissionState } from '../enums/submission-state.enum';

// DTO for PI / Collaborator updates: all fields optional except title/description are disallowed
export class UpdateArtifactDetailsDto {
  keywords?: string[];
  links?: string[];
  dois?: string[];
  fundingAgencies?: string[];
  acknowledgements?: string;
  manifest?: ManifestItem[];
  footprint?: string;
  submittedAt?: Date | string;
  verified?: boolean;
  submissionState?: SubmissionState;
}
