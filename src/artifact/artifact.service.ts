import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import { OrganizationEntity } from 'src/organization/organization.entity';
import validator from 'validator';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Get All Artifacts
  async findAll(): Promise<ArtifactEntity[]> {
    return await this.artifactRepository.find({ relations: ['organization'] });
  }

  // Get One Artifact
  async findOne(id: string): Promise<ArtifactEntity> {
    const artifact: ArtifactEntity = await this.artifactRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!artifact)
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    return artifact;
  }

  // Create one Artifact
  async create(
    artifact: Partial<ArtifactEntity>,
    organizationId: string,
  ): Promise<ArtifactEntity> {
    // The organizationId should be a valid UUID
    if (!validator.isUUID(organizationId))
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    if (!artifact.name) {
      throw new BusinessLogicException(
        'The name of the artifact is required',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // Unique Name
    const existingArtifact: ArtifactEntity =
      await this.artifactRepository.findOne({
        where: { name: artifact.name },
      });

    if (existingArtifact) {
      throw new BusinessLogicException(
        'The artifact name provided is already in use',
        BusinessError.BAD_REQUEST,
      );
    }
    if (!artifact.description || artifact.description.length < 200) {
      throw new BusinessLogicException(
        'The description of the artifact is required and should be at least 200 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    try {
      JSON.parse(artifact.body);
    } catch {
      throw new BusinessLogicException(
        // Add the error message to the response
        'The body of the artifact should be a valid JSON object',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // Check if the organization exists and assign it
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // Create and save the artifact
    const newArtifact = this.artifactRepository.create({
      name: artifact.name,
      description: artifact.description,
      body: artifact.body,
      timeStamp: new Date(),
      organization,
    });

    return await this.artifactRepository.save(newArtifact);
  }
}
