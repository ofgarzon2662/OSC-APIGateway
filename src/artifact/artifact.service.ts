import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';
import { OrganizationArtifactService } from '../organization-artifact/organization-artifact.service';
import { In } from 'typeorm';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    private readonly organizationArtifactService: OrganizationArtifactService,
  ) {}

  // Get All Artifacts
  async findAll(organizationId: string): Promise<ArtifactEntity[]> {
    this.validateArtifactId(organizationId);
    
    // Utilizamos el servicio de relaciones para obtener los artefactos de una organización
    const relationDtos = await this.organizationArtifactService.findArtifactsByOrganization(organizationId);
    
    // Convertimos los DTOs a entidades
    const artifactIds = relationDtos.map(dto => dto.artifactId);
    
    if (artifactIds.length === 0) {
      return [];
    }
    
    // TypeORM v0.2.x usa findByIds con dos argumentos, pero en versiones más recientes
    // se debe usar findBy con un objeto que contenga un operador 'in'
    return await this.artifactRepository.find({
      where: { id: In(artifactIds) },
      relations: ['organization'],
    });
  }

  // Get One Artifact
  async findOne(orgId: string, artifactId: string): Promise<ArtifactEntity> {
    this.validateOrganizationId(orgId);
    this.validateArtifactId(artifactId);

    // Verificamos que el artefacto pertenezca a la organización usando el servicio de relaciones
    try {
      await this.organizationArtifactService.findOneArtifactByOrganization(orgId, artifactId);
    } catch (error) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist in the organization',
        BusinessError.NOT_FOUND,
      );
    }

    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId },
      relations: ['organization'],
    });

    if (!artifact || artifact.organization.id !== orgId) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist in the organization',
        BusinessError.NOT_FOUND,
      );
    }

    return artifact;
  }

  // Create one Artifact
  async create(
    artifact: Partial<ArtifactEntity>,
    organizationId: string,
  ): Promise<ArtifactEntity> {
    this.validateOrganizationId(organizationId);

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
    const existingArtifacts = await this.findAll(organizationId);
    const nameExists = existingArtifacts.some(a => a.name === artifact.name);
    
    if (nameExists) {
      throw new BusinessLogicException(
        'The artifact name provided is already in use within this organization',
        BusinessError.BAD_REQUEST,
      );
    }

    // Create the Artifact without organization first
    const newArtifact = this.artifactRepository.create({
      ...artifact,
      timeStamp: new Date(),
    });
    
    const savedArtifact = await this.artifactRepository.save(newArtifact);
    
    // Now associate it with the organization using the relationship service
    await this.organizationArtifactService.addArtifactToOrganization({
      artifactId: savedArtifact.id,
      organizationId,
      description: artifact.description,
    });
    
    // Reload the artifact with the organization relationship
    return await this.artifactRepository.findOne({
      where: { id: savedArtifact.id },
      relations: ['organization'],
    });
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

    // Check for uniqueness of name if it's being updated
    if (artifact.name && artifact.name !== artifactToUpdate.name) {
      const existingArtifacts = await this.findAll(artifactToUpdate.organization.id);
      const nameExists = existingArtifacts.some(a => a.name === artifact.name && a.id !== id);
      
      if (nameExists) {
        throw new BusinessLogicException(
          'The artifact name provided is already in use within this organization',
          BusinessError.BAD_REQUEST,
        );
      }
    }

    // Verify that the description is at least 200 characters long
    if (artifact.description && artifact.description.length < 200) {
      throw new BusinessLogicException(
        'The description must be at least 200 characters long',
        BusinessError.BAD_REQUEST,
      );
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
      relations: ['organization'],
    });
    
    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Primero eliminamos la relación con la organización
    if (artifact.organization) {
      await this.organizationArtifactService.removeArtifactFromOrganization(
        id, 
        artifact.organization.id
      );
    }

    // Luego eliminamos el artefacto
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
