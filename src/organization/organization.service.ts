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

  // Get All Organizations
  async findAll(): Promise<OrganizationEntity[]> {
    const orgs = await this.organizationRepository.find({
      relations: ['users', 'artifacts'],
    });
    if (!orgs || orgs.length === 0)
      throw new BusinessLogicException(
        'There are no organizations in the database',
        BusinessError.NOT_FOUND,
      );
    if (orgs.length > 1)
      throw new BusinessLogicException(
        'There is more than one organization in the database. This should not happen',
        BusinessError.PRECONDITION_FAILED,
      );

    return orgs;
  }

  // Get One Organization

  async findOne(id: string): Promise<OrganizationEntity> {
    const organization: OrganizationEntity =
      await this.organizationRepository.findOne({
        where: { id },
        relations: ['users', 'artifacts'],
      });
    if (!organization)
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    return organization;
  }

  // Create one organization

  async create(organization: OrganizationEntity): Promise<OrganizationEntity> {
    if (organization.description.length > 250) {
      throw new BusinessLogicException(
        'The description cannot be longer than 250 characters',
        BusinessError.BAD_REQUEST,
      );
    }
    const countOrganization = await this.organizationRepository.count();

    if (countOrganization > 0) {
      throw new BusinessLogicException(
        'There is already an organization in the database. There can only be one.',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    return await this.organizationRepository.save(organization);
  }

  // Update

  async update(
    id: string,
    organization: OrganizationEntity,
  ): Promise<OrganizationEntity> {
    const organizationToUpdate: OrganizationEntity =
      await this.organizationRepository.findOne({ where: { id } });
    if (!organizationToUpdate)
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    if (organization.description.length > 250) {
      throw new BusinessLogicException(
        'The description cannot be longer than 250 characters',
        BusinessError.BAD_REQUEST,
      );
    }

    return await this.organizationRepository.save(organization);
  }

  // Delete

  async delete(id: string) {
    const organization: OrganizationEntity =
      await this.organizationRepository.findOne({ where: { id } });
    if (!organization)
      throw new BusinessLogicException(
        'The organization with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    await this.organizationRepository.remove(organization);
  }
}
