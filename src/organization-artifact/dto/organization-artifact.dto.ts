import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class OrganizationArtifactDto {
  @Expose()
  organizationId: string;

  @Expose()
  organizationName: string;

  @Expose()
  artifactId: string;

  @Expose()
  artifactName: string;

  @Expose()
  description: string;

  @Expose()
  timeStamp: Date;
}
