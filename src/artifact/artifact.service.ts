import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
  ) {}

  // Get All Artifacts
  async findAll(): Promise<ArtifactEntity[]> {
    return await this.artifactRepository.find({ relations: ['organization'] });
  }

  // Get One Artifact
  async findOne(artifactId: string): Promise<ArtifactEntity> {
    this.validateArtifactId(artifactId);
    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId },
      relations: ['organization'],
    });
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    return artifact;
  }

  // Create one Artifact
  async create(artifact: Partial<ArtifactEntity>): Promise<ArtifactEntity> {
    this.validateTitle(artifact.title);
    this.validateDescription(
      artifact.description,
      BusinessError.PRECONDITION_FAILED,
    );
    artifact.body = this.validateBody(
      artifact.body,
      BusinessError.PRECONDITION_FAILED,
    );

    if (artifact.keywords) {
      this.validateKeywords(
        artifact.keywords,
        BusinessError.PRECONDITION_FAILED,
      );
    }

    if (artifact.links) {
      this.validateLinks(artifact.links, BusinessError.PRECONDITION_FAILED);
    }

    // Create the Artifact without organization first
    const newArtifact = this.artifactRepository.create({
      ...artifact,
      submittedAt: new Date(),
    });

    const savedArtifact = await this.artifactRepository.save(newArtifact);

    return savedArtifact;
  }

  // Update an Artifact
  async update(
    id: string,
    artifact: Partial<ArtifactEntity>,
  ): Promise<ArtifactEntity> {
    this.validateArtifactId(id);
    this.validateUpdateFields(artifact);

    const artifactToUpdate = await this.findArtifactById(id);
    const allowedUpdates = this.processUpdateFields(artifact);

    // Update and save the artifact with only the allowed fields
    Object.assign(artifactToUpdate, allowedUpdates);
    return await this.artifactRepository.save(artifactToUpdate);
  }

  // Delete an Artifact
  async delete(id: string): Promise<void> {
    this.validateArtifactId(id);

    const artifact = await this.findArtifactById(id);

    // Delete the artifact directly
    await this.artifactRepository.remove(artifact);
  }

  // Utility validation functions
  private validateArtifactId(artifactId: string): void {
    if (!artifactId || !validator.isUUID(artifactId)) {
      throw new BusinessLogicException(
        'The artifactId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  private validateTitle(title: string): void {
    if (!title || title.length < 3 || !/^[a-zA-Z0-9-]+$/.test(title)) {
      throw new BusinessLogicException(
        'The title of the artifact is required, must be at least 3 characters long, and can only contain alphanumeric characters and hyphens',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  private validateDescription(
    description: string,
    errorType: BusinessError = BusinessError.BAD_REQUEST,
  ): void {
    if (!description || description.length < 200) {
      const message =
        errorType === BusinessError.PRECONDITION_FAILED
          ? 'The description of the artifact is required and should be at least 200 characters long'
          : 'The description must be at least 200 characters long';

      throw new BusinessLogicException(message, errorType);
    }
  }

  private validateBody(
    body: any,
    errorType: BusinessError = BusinessError.BAD_REQUEST,
  ): any {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        throw new BusinessLogicException(
          'The body of the artifact should be a valid JSON object',
          errorType,
        );
      }
    } else if (!body || typeof body !== 'object') {
      const message =
        errorType === BusinessError.PRECONDITION_FAILED
          ? 'The body of the artifact is required and should be a valid JSON object'
          : 'The body of the artifact should be a valid JSON object';

      throw new BusinessLogicException(message, errorType);
    }
    return body;
  }

  private validateKeywords(
    keywords: string[],
    errorType: BusinessError = BusinessError.BAD_REQUEST,
  ): void {
    const totalKeywordsLength = keywords.join('').length;
    if (totalKeywordsLength > 200) {
      throw new BusinessLogicException(
        'The keywords array can have at most 200 characters in total',
        errorType,
      );
    }
  }

  private validateLinks(
    links: string[],
    errorType: BusinessError = BusinessError.BAD_REQUEST,
  ): void {
    const totalLinksLength = links.join('').length;
    if (totalLinksLength > 1000) {
      throw new BusinessLogicException(
        'The links array can have at most 1000 characters in total',
        errorType,
      );
    }

    // Validate each link
    for (const link of links) {
      if (!validator.isURL(link)) {
        throw new BusinessLogicException(
          'Each link in the links array must be a valid URL',
          errorType,
        );
      }
    }
  }

  private validateUpdateFields(artifact: Partial<ArtifactEntity>): void {
    // Only allow updating description, body, keywords, and links
    if (
      'title' in artifact ||
      'contributor' in artifact ||
      'submittedAt' in artifact ||
      'organization' in artifact
    ) {
      throw new BusinessLogicException(
        'Only description, body, keywords, and links can be updated',
        BusinessError.BAD_REQUEST,
      );
    }
  }

  private async findArtifactById(id: string): Promise<ArtifactEntity> {
    const artifact = await this.artifactRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    return artifact;
  }

  private processUpdateFields(
    artifact: Partial<ArtifactEntity>,
  ): Partial<ArtifactEntity> {
    const allowedUpdates: Partial<ArtifactEntity> = {};

    if (artifact.description) {
      this.validateDescription(artifact.description);
      allowedUpdates.description = artifact.description;
    }

    if (artifact.body) {
      allowedUpdates.body = this.validateBody(artifact.body);
    }

    if (artifact.keywords) {
      this.validateKeywords(artifact.keywords);
      allowedUpdates.keywords = artifact.keywords;
    }

    if (artifact.links) {
      this.validateLinks(artifact.links);
      allowedUpdates.links = artifact.links;
    }

    return allowedUpdates;
  }
}
