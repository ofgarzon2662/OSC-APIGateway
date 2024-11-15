import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';
import { OrganizationEntity } from '../organization/organization.entity';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Get All Artifacts
  async findAll(organizationId: string): Promise<ArtifactEntity[]> {
    this.validateOrganizationId(organizationId);

    // Check if the organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    return await this.artifactRepository.find({
      where: { organization },
      relations: ['organization'],
    });
  }

  // Get One Artifact
  async findOne(orgId: string, artifactId: string): Promise<ArtifactEntity> {
    this.validateOrganizationId(orgId);
    this.validateArtifactId(artifactId);

    // Check if the organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: orgId },
    });
    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Check that the artifact is part of the organization
    const artifact: ArtifactEntity = await this.artifactRepository.findOne({
      where: { id: artifactId, organization },
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
    this.validateOrganizationId(organizationId);

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

    // Ensure description is at least 200 characters long
    if (!artifact.description || artifact.description.length < 200) {
      throw new BusinessLogicException(
        'The description of the artifact is required and should be at least 200 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    // Parse `body` JSON string if necessary
    if (typeof artifact.body === 'string') {
      try {
        artifact.body = JSON.parse(artifact.body); // Parse only if it's a string
      } catch {
        throw new BusinessLogicException(
          'The body of the artifact should be a valid JSON object',
          BusinessError.PRECONDITION_FAILED,
        );
      }
    }

    // Validate name uniqueness within organization
    const existingArtifact = await this.artifactRepository.findOne({
      where: { name: artifact.name, organization },
    });
    if (existingArtifact) {
      throw new BusinessLogicException(
        'The artifact name provided is already in use within this organization',
        BusinessError.BAD_REQUEST,
      );
    }

    // Create and save the Artifact
    const newArtifact = this.artifactRepository.create({
      ...artifact,
      organization,
      timeStamp: new Date(),
    });
    return await this.artifactRepository.save(newArtifact);
  }

  // Update an Artifact
  async update(
    id: string,
    artifact: Partial<ArtifactEntity>,
  ): Promise<ArtifactEntity> {
    this.validateArtifactId(id);

    const artifactToUpdate = await this.artifactRepository.findOne({
      where: { id },
    });
    if (!artifactToUpdate) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Check for uniqueness of name if it's being updated
    if (artifact.name && artifact.name !== artifactToUpdate.name) {
      const existingArtifact = await this.artifactRepository.findOne({
        where: {
          name: artifact.name,
          organization: artifactToUpdate.organization,
        },
      });
      if (existingArtifact) {
        throw new BusinessLogicException(
          'The artifact name provided is already in use within this organization',
          BusinessError.BAD_REQUEST,
        );
      }
    }

    // Update and save the artifact
    Object.assign(artifactToUpdate, artifact);
    return await this.artifactRepository.save(artifactToUpdate);
  }

  // Delete an Artifact
  async delete(id: string): Promise<void> {
    this.validateArtifactId(id);

    const artifact = await this.artifactRepository.findOne({
      where: { id },
    });
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    await this.artifactRepository.remove(artifact);
  }

  // Utility validation functions
  private validateOrganizationId(organizationId: string): void {
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  private validateArtifactId(artifactId: string): void {
    if (!artifactId || !validator.isUUID(artifactId)) {
      throw new BusinessLogicException(
        'The artifactId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }
}
