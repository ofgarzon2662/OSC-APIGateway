import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Obtener todos los organizationes
  async findAll(): Promise<OrganizationEntity[]> {
    return await this.organizationRepository.find({ relations: ['users'] });
  }

  // Obtener un organization por id

  async findOne(id: string): Promise<OrganizationEntity> {
    const organization: OrganizationEntity =
      await this.organizationRepository.findOne({
        where: { id },
        relations: ['users'],
      });
    if (!organization)
      throw new BusinessLogicException(
        'El organization con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    return organization;
  }

  // crear un organization

  async create(organization: OrganizationEntity): Promise<OrganizationEntity> {
    if (organization.descripcion.length > 100) {
      throw new BusinessLogicException(
        'La descripción no puede tener más de 100 caracteres',
        BusinessError.BAD_REQUEST,
      );
    }
    return await this.organizationRepository.save(organization);
  }

  // Actualizar un organization

  async update(
    id: string,
    organization: OrganizationEntity,
  ): Promise<OrganizationEntity> {
    const organizationToUpdate: OrganizationEntity =
      await this.organizationRepository.findOne({ where: { id } });
    if (!organizationToUpdate)
      throw new BusinessLogicException(
        'El organization con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    if (organization.descripcion.length > 100) {
      throw new BusinessLogicException(
        'La descripción no puede tener más de 100 caracteres',
        BusinessError.BAD_REQUEST,
      );
    }

    return await this.organizationRepository.save(organization);
  }

  // Eliminar un organization

  async delete(id: string) {
    const organization: OrganizationEntity =
      await this.organizationRepository.findOne({ where: { id } });
    if (!organization)
      throw new BusinessLogicException(
        'El organization con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    await this.organizationRepository.remove(organization);
  }
}
