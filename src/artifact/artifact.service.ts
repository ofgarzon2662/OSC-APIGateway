import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';

import { GetArtifactDto } from './dto/get-artifact.dto';
import { ListArtifactDto } from './dto/list-artifact.dto';
import { OrganizationEntity } from '../organization/organization.entity';
import { SubmissionState } from './enums/submission-state.enum';

// Definir una interfaz para la información del creador del artefacto
interface SubmitterInfo {
  username: string;
  email: string;
}

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Private helper methods to reduce code duplication
  
  /**
   * Validates if the provided ID is a valid UUID
   * @param id The ID to validate
   * @param fieldName The name of the field for error messages
   * @throws BusinessLogicException if the ID is invalid
   */
  private validateId(id: string, fieldName: string): void {
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        `The ${fieldName} provided is not valid`,
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  /**
   * Finds the single organization in the system or throws an exception if not found
   * @returns The organization entity
   * @throws BusinessLogicException if no organization is found
   */
  private async findOrganizationOrThrow(): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.findOne({
      where: {}
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'No organization exists in the system',
        BusinessError.NOT_FOUND,
      );
    }
    
    return organization;
  }

  /**
   * Finds an artifact by ID or throws an exception if not found
   * @param id The artifact ID
   * @param includeRelations Whether to include relations in the query
   * @returns The artifact entity
   * @throws BusinessLogicException if the artifact is not found
   */
  private async findArtifactOrThrow(
    id: string, 
    includeRelations: boolean = false
  ): Promise<ArtifactEntity> {
    this.validateId(id, 'artifactId');
    
    const queryOptions: any = {
      where: { id }
    };
    
    if (includeRelations) {
      queryOptions.relations = ['organization'];
    }
    
    const artifact = await this.artifactRepository.findOne(queryOptions);
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
    return artifact;
  }

  /**
   * Validates the create artifact DTO
   * @param createArtifactDto The DTO to validate
   * @throws BusinessLogicException if validation fails
   */
  private validateCreateArtifactDto(createArtifactDto: CreateArtifactDto): void {
    if (!createArtifactDto.title || createArtifactDto.title.length < 3) {
      throw new BusinessLogicException(
        'The title of the artifact is required and must be at least 3 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    if (!createArtifactDto.description || createArtifactDto.description.length < 50) {
      throw new BusinessLogicException(
        'The description must be at least 50 characters long',
        BusinessError.BAD_REQUEST,
      );
    }
    
    const totalKeywordsLength = createArtifactDto.keywords.join('').length;
    if (totalKeywordsLength > 1000) {
      throw new BusinessLogicException(
        'The keywords array can have at most 1000 characters in total',
        BusinessError.BAD_REQUEST,
      );
    }
    
    const totalLinksLength = createArtifactDto.links.join('').length;
    if (totalLinksLength > 2000) {
      throw new BusinessLogicException(
        'The links array can have at most 2000 characters in total',
        BusinessError.BAD_REQUEST,
      );
    }
    
    // Validate each link
    for (const link of createArtifactDto.links) {
      if (!validator.isURL(link)) {
        throw new BusinessLogicException(
          'Each link in the links array must be a valid URL',
          BusinessError.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * Checks if an artifact with the same title already exists in the organization
   * @param title The title to check
   * @throws BusinessLogicException if an artifact with the same title exists
   */
  private async checkTitleUniqueness(title: string, organization: OrganizationEntity): Promise<void> {
    const existingArtifact = await this.artifactRepository.findOne({
      where: { 
        title,
        organization: { id: organization.id }
      }
    });

    if (existingArtifact) {
      throw new BusinessLogicException(
        'An artifact with this title already exists in the organization',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  /**
   * Validates the update artifact DTO
   * @param updateArtifactDto The DTO to validate
   * @throws BusinessLogicException if validation fails
   */
  private validateUpdateArtifactDto(updateArtifactDto: UpdateArtifactDto): void {
    if (
      'title' in updateArtifactDto ||
      'contributor' in updateArtifactDto ||
      'description' in updateArtifactDto ||
      'keywords' in updateArtifactDto ||
      'links' in updateArtifactDto ||
      'dois' in updateArtifactDto ||
      'fundingAgencies' in updateArtifactDto ||
      'acknowledgements' in updateArtifactDto ||
      'fileName' in updateArtifactDto ||
      'hash' in updateArtifactDto ||
      'organization' in updateArtifactDto
    ) {
      throw new BusinessLogicException(
        'Cannot update title, contributor, or submittedAt fields',
        BusinessError.BAD_REQUEST,
      );
    }
  }

  /**
   * Validates the update artifact DTO for status updates
   * @param updateStatusDto The DTO to validate
   * @throws BusinessLogicException if validation fails
   */
  private validateUpdateStatusDto(updateStatusDto: UpdateArtifactDto): void {
    const allowedFields = ['submissionState', 'submittedAt', 'blockchainTxId', 'peerId', 'verified', 'lastTimeVerified'];
    const receivedFields = Object.keys(updateStatusDto);
    
    const forbiddenFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (forbiddenFields.length > 0) {
      throw new BusinessLogicException(
        `Cannot update the following fields in status update: ${forbiddenFields.join(', ')}. Only allowed: ${allowedFields.join(', ')}`,
        BusinessError.BAD_REQUEST,
      );
    }
  }

  // Get All Artifacts - Return minimal fields
  async findAll(): Promise<ListArtifactDto[]> {
    // Find the organization
    const organization = await this.findOrganizationOrThrow();
    
    // Find artifacts for the organization
    const artifacts = await this.artifactRepository.find({
      where: { organization: { id: organization.id } }
    });
    
    // Transform the result to include minimal fields
    return artifacts.map(artifact => ({
      id: artifact.id,
      title: artifact.title,
      description: artifact.description,
      lastTimeVerified: artifact.lastTimeVerified
    }));
  }

  // Get One Artifact - Return all fields
  async findOne(id: string): Promise<GetArtifactDto> {
    // Verificar primero que exista una organización
    await this.findOrganizationOrThrow();
    
    // Find the artifact with the organization relation
    const artifact = await this.findArtifactOrThrow(id, true);
    
    // Transform the result to include all fields
    return {
      id: artifact.id,
      title: artifact.title,
      description: artifact.description,
      keywords: artifact.keywords,
      links: artifact.links,
      dois: artifact.dois,
      fundingAgencies: artifact.fundingAgencies,
      acknowledgements: artifact.acknowledgements,
      fileName: artifact.fileName,
      hash: artifact.hash,
      verified: artifact.verified,
      lastTimeVerified: artifact.lastTimeVerified,
      submissionState: artifact.submissionState,
      submitterEmail: artifact.submitterEmail,
      submitterUsername: artifact.submitterUsername,
      submittedAt: artifact.submittedAt,
      organization: {
        name: artifact.organization.name
      }
    };
  }

  // Create one Artifact
  async create(
    createArtifactDto: CreateArtifactDto, 
    submitterInfo: SubmitterInfo
  ): Promise<ListArtifactDto> {
    // Validar la información del creador
    if (!submitterInfo.email || !validator.isEmail(submitterInfo.email)) {
      throw new BusinessLogicException(
        'Invalid submitter email provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    if (!submitterInfo.username || submitterInfo.username.trim() === '') {
      throw new BusinessLogicException(
        'Invalid submitter username provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Find the organization
    const organization = await this.findOrganizationOrThrow();
    
    // Validate the create artifact DTO
    this.validateCreateArtifactDto(createArtifactDto);
    
    // Check if an artifact with the same title already exists
    await this.checkTitleUniqueness(createArtifactDto.title, organization);
    
    // Create the artifact
    const artifact = this.artifactRepository.create({
      ...createArtifactDto,
      organization,
      submitterEmail: submitterInfo.email,
      submitterUsername: submitterInfo.username,
      submissionState: SubmissionState.PENDING
    });
    
    const savedArtifact = await this.artifactRepository.save(artifact);
    
    // Return only the minimal fields
    return {
      id: savedArtifact.id,
      title: savedArtifact.title,
      description: savedArtifact.description,
      lastTimeVerified: savedArtifact.lastTimeVerified
    };
  }

  // Update an Artifact - Only allow updating specific fields
  async update(id: string, updateArtifactDto: UpdateArtifactDto): Promise<ArtifactEntity> {
    // Verificar primero que exista una organización
    await this.findOrganizationOrThrow();

    // Find the artifact with the organization relation
    const artifact = await this.findArtifactOrThrow(id, true);
    
    // Validate update fields
    this.validateUpdateArtifactDto(updateArtifactDto);
    
    // Apply the updates
    Object.assign(artifact, updateArtifactDto);
    return await this.artifactRepository.save(artifact);
  }

  // Delete an Artifact
  async delete(id: string): Promise<void> {
    // Verificar primero que exista una organización
    await this.findOrganizationOrThrow();

    // Find the artifact
    const artifact = await this.findArtifactOrThrow(id);
    
    // Usar createQueryBuilder().delete() en lugar de remove para respetar las cascadas
    await this.artifactRepository.createQueryBuilder()
      .delete()
      .where("id = :id", { id: artifact.id })
      .execute();
  }

  async updateStatus(id: string, updateStatusDto: UpdateArtifactDto): Promise<ArtifactEntity> {
    const artifact = await this.findArtifactOrThrow(id);
    
    // Validate that only allowed fields are being updated
    this.validateUpdateStatusDto(updateStatusDto);
    
    // Update the artifact with the new status information
    if (updateStatusDto.submissionState !== undefined) {
      artifact.submissionState = updateStatusDto.submissionState;
    }
    
    if (updateStatusDto.submittedAt !== undefined) {
      artifact.submittedAt = new Date(updateStatusDto.submittedAt);
    }
    
    if (updateStatusDto.blockchainTxId) {
      artifact.blockchainTxId = updateStatusDto.blockchainTxId;
    }
    
    if (updateStatusDto.peerId) {
      artifact.peerId = updateStatusDto.peerId;
    }

    if (updateStatusDto.verified !== undefined) {
      artifact.verified = updateStatusDto.verified;
    }

    if (updateStatusDto.lastTimeVerified !== undefined) {
      artifact.lastTimeVerified = updateStatusDto.lastTimeVerified;
    }

    return await this.artifactRepository.save(artifact);
  }
}
