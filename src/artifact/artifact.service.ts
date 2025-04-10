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
   * Finds an organization by ID or throws an exception if not found
   * @param organizationId The organization ID
   * @returns The organization entity
   * @throws BusinessLogicException if the organization is not found
   */
  private async findOrganizationOrThrow(organizationId: string): Promise<OrganizationEntity> {
    this.validateId(organizationId, 'organizationId');
    
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
    return organization;
  }

  /**
   * Finds an artifact by ID and organization ID or throws an exception if not found
   * @param id The artifact ID
   * @param organizationId The organization ID
   * @param includeRelations Whether to include relations in the query
   * @returns The artifact entity
   * @throws BusinessLogicException if the artifact is not found
   */
  private async findArtifactOrThrow(
    id: string, 
    organizationId: string, 
    includeRelations: boolean = false
  ): Promise<ArtifactEntity> {
    this.validateId(id, 'artifactId');
    
    const queryOptions: any = {
      where: { 
        id,
        organization: { id: organizationId }
      }
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
   * @param organizationId The organization ID
   * @throws BusinessLogicException if an artifact with the same title exists
   */
  private async checkTitleUniqueness(title: string, organizationId: string): Promise<void> {
    const existingArtifact = await this.artifactRepository.findOne({
      where: { 
        title,
        organization: { id: organizationId }
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

  // Get All Artifacts - Return minimal fields
  async findAll(organizationId: string): Promise<ListArtifactDto[]> {
    // Validate organization ID and find organization
    await this.findOrganizationOrThrow(organizationId);
    
    // Find artifacts for the organization
    const artifacts = await this.artifactRepository.find({
      where: { organization: { id: organizationId } }
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
  async findOne(id: string, organizationId: string): Promise<GetArtifactDto> {
    // Validate organization ID and find organization
    await this.findOrganizationOrThrow(organizationId);
    
    // Find the artifact with the organization relation
    const artifact = await this.findArtifactOrThrow(id, organizationId, true);
    
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
      submittedAt: artifact.submittedAt,
      organization: {
        name: artifact.organization.name
      }
    };
  }

  // Create one Artifact
  async create(
    createArtifactDto: CreateArtifactDto, 
    submitterEmail: string,
    organizationId: string
  ): Promise<ListArtifactDto> {
    // Validate submitter email
    if (!submitterEmail || !validator.isEmail(submitterEmail)) {
      throw new BusinessLogicException(
        'Invalid submitter email provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate organization ID and find organization
    const organization = await this.findOrganizationOrThrow(organizationId);
    
    // Validate the create artifact DTO
    this.validateCreateArtifactDto(createArtifactDto);
    
    // Check if an artifact with the same title already exists
    await this.checkTitleUniqueness(createArtifactDto.title, organizationId);
    
    // Create the artifact
    const artifact = this.artifactRepository.create({
      ...createArtifactDto,
      organization,
      submitterEmail,
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
  async update(id: string, updateArtifactDto: UpdateArtifactDto, organizationId: string): Promise<ArtifactEntity> {
    // Validate organization ID and find organization
    await this.findOrganizationOrThrow(organizationId);
    
    // Find the artifact with the organization relation
    const artifact = await this.findArtifactOrThrow(id, organizationId, true);
    
    // Validate update fields
    this.validateUpdateArtifactDto(updateArtifactDto);
    
    // Apply the updates
    Object.assign(artifact, updateArtifactDto);
    return await this.artifactRepository.save(artifact);
  }

  // Delete an Artifact
  async delete(id: string, organizationId: string): Promise<void> {
    // Validate organization ID and find organization
    await this.findOrganizationOrThrow(organizationId);
    
    // Find the artifact
    const artifact = await this.findArtifactOrThrow(id, organizationId);
    
    // Delete the artifact directly
    await this.artifactRepository.remove(artifact);
  }
}
