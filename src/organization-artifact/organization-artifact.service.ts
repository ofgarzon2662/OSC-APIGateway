import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';
import {
  BusinessLogicException,
  BusinessError,
} from '../shared/errors/business-errors';
import { AddArtifactToOrganizationDto } from './dto/add-artifact-to-organization.dto';
import { OrganizationArtifactDto } from './dto/organization-artifact.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateArtifactInOrganizationDto } from './dto/update-artifact-in-organization.dto';

@Injectable()
export class OrganizationArtifactService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
  ) {}

  async findArtifactsByOrganization(
    organizationId: string,
  ): Promise<OrganizationArtifactDto[]> {
    // Validar organizationId
    this.validateOrganizationId(organizationId);

    // Buscar la organización
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['artifacts'],
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Transformar a DTO
    return organization.artifacts.map((artifact) => {
      const dto = new OrganizationArtifactDto();
      dto.organizationId = organization.id;
      dto.organizationName = organization.name;
      dto.artifactId = artifact.id;
      dto.artifactName = artifact.name;
      dto.description = artifact.description;
      dto.timeStamp = artifact.timeStamp;
      return plainToInstance(OrganizationArtifactDto, dto);
    });
  }

  async findOneArtifactByOrganization(
    organizationId: string,
    artifactId: string,
  ): Promise<OrganizationArtifactDto> {
    // Validar IDs
    this.validateOrganizationId(organizationId);
    this.validateArtifactId(artifactId);

    // Buscar la organización
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Buscar el artefacto dentro de la organización
    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId, organization: { id: organizationId } },
      relations: ['organization'],
    });

    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found in the organization',
        BusinessError.NOT_FOUND,
      );
    }

    // Transformar a DTO
    const dto = new OrganizationArtifactDto();
    dto.organizationId = organization.id;
    dto.organizationName = organization.name;
    dto.artifactId = artifact.id;
    dto.artifactName = artifact.name;
    dto.description = artifact.description;
    dto.timeStamp = artifact.timeStamp;
    return plainToInstance(OrganizationArtifactDto, dto);
  }

  async addArtifactToOrganization(
    dto: AddArtifactToOrganizationDto,
  ): Promise<OrganizationArtifactDto> {
    const { artifactId, organizationId } = dto;

    // Validar IDs
    this.validateArtifactId(artifactId);
    this.validateOrganizationId(organizationId);

    // Buscar la organización
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Buscar el artefacto
    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId },
    });

    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Asociar el artefacto a la organización
    artifact.organization = organization;

    // Si hay descripción en el DTO, actualizar la descripción del artefacto
    if (dto.description) {
      artifact.description = dto.description;
    }

    // Guardar los cambios
    await this.artifactRepository.save(artifact);

    // Transformar a DTO
    const responseDto = new OrganizationArtifactDto();
    responseDto.organizationId = organization.id;
    responseDto.organizationName = organization.name;
    responseDto.artifactId = artifact.id;
    responseDto.artifactName = artifact.name;
    responseDto.description = artifact.description;
    responseDto.timeStamp = artifact.timeStamp;
    return plainToInstance(OrganizationArtifactDto, responseDto);
  }

  async updateArtifactInOrganization(
    organizationId: string,
    artifactId: string,
    dto: UpdateArtifactInOrganizationDto,
  ): Promise<OrganizationArtifactDto> {
    // Validar IDs
    this.validateOrganizationId(organizationId);
    this.validateArtifactId(artifactId);

    // Verificar que el artefacto existe y pertenece a la organización
    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId, organization: { id: organizationId } },
      relations: ['organization'],
    });

    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact with the given id was not found in the organization',
        BusinessError.NOT_FOUND,
      );
    }

    // Verificar que la organización existe
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization with the given id was not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Actualizar los campos si se proporcionan
    if (dto.description) {
      // Verificar que la descripción cumple con los requisitos
      if (dto.description.length < 200) {
        throw new BusinessLogicException(
          'The description must be at least 200 characters long',
          BusinessError.BAD_REQUEST,
        );
      }
      artifact.description = dto.description;
    }

    if (dto.name) {
      // Verificar que el nombre no está en uso por otro artefacto
      const existingArtifact = await this.artifactRepository.findOne({
        where: {
          name: dto.name,
          organization: { id: organizationId },
          id: Not(artifactId), // Excluir el artefacto actual
        },
      });

      if (existingArtifact) {
        throw new BusinessLogicException(
          'The artifact name is already in use within this organization',
          BusinessError.BAD_REQUEST,
        );
      }

      artifact.name = dto.name;
    }

    // Guardar los cambios
    await this.artifactRepository.save(artifact);

    // Transformar a DTO
    const responseDto = new OrganizationArtifactDto();
    responseDto.organizationId = organization.id;
    responseDto.organizationName = organization.name;
    responseDto.artifactId = artifact.id;
    responseDto.artifactName = artifact.name;
    responseDto.description = artifact.description;
    responseDto.timeStamp = artifact.timeStamp;
    return plainToInstance(OrganizationArtifactDto, responseDto);
  }

  async removeArtifactFromOrganization(
    artifactId: string,
    organizationId: string,
  ): Promise<void> {
    // Validar IDs
    this.validateArtifactId(artifactId);
    this.validateOrganizationId(organizationId);

    // Buscar el artefacto con su organización
    const artifact = await this.artifactRepository.findOne({
      where: { id: artifactId, organization: { id: organizationId } },
      relations: ['organization'],
    });

    if (!artifact) {
      throw new BusinessLogicException(
        'The artifact is not associated with the given organization',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    // Desasociar el artefacto de la organización
    artifact.organization = null;
    await this.artifactRepository.save(artifact);
  }

  private validateOrganizationId(organizationId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new BusinessLogicException(
        'The organizationId is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  private validateArtifactId(artifactId: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artifactId)) {
      throw new BusinessLogicException(
        'The artifactId is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }
}
