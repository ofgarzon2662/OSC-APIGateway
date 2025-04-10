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

  // Get All Artifacts - Return minimal fields
  async findAll(organizationId: string): Promise<ListArtifactDto[]> {
    // Validate organization ID
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
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
    // Validate artifact ID
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifactId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate organization ID
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
    // Find the artifact with the organization relation
    const artifact = await this.artifactRepository.findOne({
      where: { 
        id,
        organization: { id: organizationId }
      },
      relations: ['organization']
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
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
    // Validate organization ID
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate submitter email
    if (!submitterEmail || !validator.isEmail(submitterEmail)) {
      throw new BusinessLogicException(
        'Invalid submitter email provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate required fields
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
    
    // Find the organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Check if an artifact with the same title already exists in the organization
    const existingArtifact = await this.artifactRepository.findOne({
      where: { 
        title: createArtifactDto.title,
        organization: { id: organizationId }
      }
    });

    if (existingArtifact) {
      throw new BusinessLogicException(
        'An artifact with this title already exists in the organization',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
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
    // Validate artifact ID
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifactId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate organization ID
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
    // Find the artifact with the organization relation
    const artifact = await this.artifactRepository.findOne({
      where: { 
        id,
        organization: { id: organizationId }
      },
      relations: ['organization']
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    
    // Validate update fields
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
    
    // Apply the updates
    Object.assign(artifact, updateArtifactDto);
    return await this.artifactRepository.save(artifact);
  }

  // Delete an Artifact
  async delete(id: string, organizationId: string): Promise<void> {
    // Validate artifact ID
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifactId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Validate organization ID
    if (!organizationId || !validator.isUUID(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    
    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Find the artifact with the organization relation
    const artifact = await this.artifactRepository.findOne({
      where: { 
        id,
        organization: { id: organizationId }
      }
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Delete the artifact directly
    await this.artifactRepository.remove(artifact);
  }
}
