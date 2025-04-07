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
import { OrganizationEntity } from '../organization/organization.entity';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Get All Artifacts - Return only specific fields
  async findAll(): Promise<GetArtifactDto[]> {
    const artifacts = await this.artifactRepository.find({ 
      relations: ['organization'],
      select: {
        id: true,
        title: true,
        submitterEmail: true,
        organization: {
          id: true,
          name: true
        }
      }
    });
    
    // Transform the result to include organizationName directly
    return artifacts.map(artifact => ({
      id: artifact.id,
      title: artifact.title,
      submitterEmail: artifact.submitterEmail,
      organizationName: artifact.organization.name
    }));
  }

  // Get One Artifact - Return only specific fields
  async findOne(id: string): Promise<GetArtifactDto> {
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }
    
    const artifact = await this.artifactRepository.findOne({
      where: { id },
      relations: ['organization'],
      select: {
        id: true,
        title: true,
        submitterEmail: true,
        organization: {
          id: true,
          name: true
        }
      }
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }
    
    // Transform the result to include organizationName directly
    return {
      id: artifact.id,
      title: artifact.title,
      submitterEmail: artifact.submitterEmail,
      organizationName: artifact.organization.name
    };
  }

  // Create one Artifact
  async create(createArtifactDto: CreateArtifactDto): Promise<ArtifactEntity> {
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
      where: { id: createArtifactDto.organizationId }
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Create the artifact with organization context
    const artifact = this.artifactRepository.create({
      ...createArtifactDto,
      organization,
    });

    return await this.artifactRepository.save(artifact);
  }

  // Update an Artifact - Only allow updating specific fields
  async update(id: string, updateArtifactDto: UpdateArtifactDto): Promise<ArtifactEntity> {
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }
    
    const artifact = await this.artifactRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
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
  async delete(id: string): Promise<void> {
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    const artifact = await this.artifactRepository.findOne({
      where: { id }
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Delete the artifact directly
    await this.artifactRepository.remove(artifact);
  }
}
