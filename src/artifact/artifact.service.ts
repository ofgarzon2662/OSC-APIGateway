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
    // Validate title: not empty, at least 3 characters, only alphanumeric and hyphens
    if (
      !artifact.title ||
      artifact.title.length < 3 ||
      !/^[a-zA-Z0-9-]+$/.test(artifact.title)
    ) {
      throw new BusinessLogicException(
        'The title of the artifact is required, must be at least 3 characters long, and can only contain alphanumeric characters and hyphens',
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
    } else if (!artifact.body || typeof artifact.body !== 'object') {
      throw new BusinessLogicException(
        'The body of the artifact is required and should be a valid JSON object',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    // Validate keywords array (max 200 characters total)
    if (artifact.keywords) {
      const totalKeywordsLength = artifact.keywords.join('').length;
      if (totalKeywordsLength > 200) {
        throw new BusinessLogicException(
          'The keywords array can have at most 200 characters in total',
          BusinessError.PRECONDITION_FAILED,
        );
      }
    }

    // Validate links array (max 1000 characters total and each link is valid)
    if (artifact.links) {
      const totalLinksLength = artifact.links.join('').length;
      if (totalLinksLength > 1000) {
        throw new BusinessLogicException(
          'The links array can have at most 1000 characters in total',
          BusinessError.PRECONDITION_FAILED,
        );
      }

      // Validate each link
      for (const link of artifact.links) {
        if (!validator.isURL(link)) {
          throw new BusinessLogicException(
            'Each link in the links array must be a valid URL',
            BusinessError.PRECONDITION_FAILED,
          );
        }
      }
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

    const artifactToUpdate = await this.artifactRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!artifactToUpdate) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Create a new object with only the allowed fields
    const allowedUpdates: Partial<ArtifactEntity> = {};

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

    // Verify that the description is at least 200 characters long
    if (artifact.description) {
      if (artifact.description.length < 200) {
        throw new BusinessLogicException(
          'The description must be at least 200 characters long',
          BusinessError.BAD_REQUEST,
        );
      }
      allowedUpdates.description = artifact.description;
    }

    // Validate body if it's being updated
    if (artifact.body) {
      if (typeof artifact.body === 'string') {
        try {
          allowedUpdates.body = JSON.parse(artifact.body);
        } catch {
          throw new BusinessLogicException(
            'The body of the artifact should be a valid JSON object',
            BusinessError.BAD_REQUEST,
          );
        }
      } else if (typeof artifact.body !== 'object') {
        throw new BusinessLogicException(
          'The body of the artifact should be a valid JSON object',
          BusinessError.BAD_REQUEST,
        );
      } else {
        allowedUpdates.body = artifact.body;
      }
    }

    // Validate keywords if they're being updated
    if (artifact.keywords) {
      const totalKeywordsLength = artifact.keywords.join('').length;
      if (totalKeywordsLength > 200) {
        throw new BusinessLogicException(
          'The keywords array can have at most 200 characters in total',
          BusinessError.BAD_REQUEST,
        );
      }
      allowedUpdates.keywords = artifact.keywords;
    }

    // Validate links if they're being updated
    if (artifact.links) {
      const totalLinksLength = artifact.links.join('').length;
      if (totalLinksLength > 1000) {
        throw new BusinessLogicException(
          'The links array can have at most 1000 characters in total',
          BusinessError.BAD_REQUEST,
        );
      }

      // Validate each link
      for (const link of artifact.links) {
        if (!validator.isURL(link)) {
          throw new BusinessLogicException(
            'Each link in the links array must be a valid URL',
            BusinessError.BAD_REQUEST,
          );
        }
      }
      allowedUpdates.links = artifact.links;
    }

    // Update and save the artifact with only the allowed fields
    Object.assign(artifactToUpdate, allowedUpdates);
    return await this.artifactRepository.save(artifactToUpdate);
  }

  // Delete an Artifact
  async delete(id: string): Promise<void> {
    this.validateArtifactId(id);

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
}
