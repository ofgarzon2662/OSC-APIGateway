import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';

@Injectable()
export class OrganizationUserService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Add a member to a organization

  async addMemberToOrganization(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationEntity> {
    const organization: OrganizationEntity =
      await this.findOrganizationById(organizationId);
    const user: UserEntity = await this.findUserById(userId);

    organization.users = [...organization.users, user];
    return await this.organizationRepository.save(organization);
  }

  // Actualizar Miembros de Un Organization

  async updateMembersFromOrganization(
    organizationId: string,
    users: UserEntity[],
  ): Promise<OrganizationEntity> {
    const organization: OrganizationEntity =
      await this.findOrganizationById(organizationId);
    for (const user of users) {
      await this.findUserById(user.id);
    }

    organization.users = users;
    return await this.organizationRepository.save(organization);
  }

  // Encontrar Miembros de un Organization

  async findMembersFromOrganization(
    organizationId: string,
  ): Promise<UserEntity[]> {
    const organization: OrganizationEntity =
      await this.findOrganizationById(organizationId);
    return organization.users;
  }

  //  Encontrar Miembro de un Organization
  async findMemberFromOrganization(
    organizationId: string,
    userId: string,
  ): Promise<UserEntity> {
    const organization: OrganizationEntity =
      await this.findOrganizationById(organizationId);
    const user: UserEntity = await this.findUserById(userId);

    const organizationUser: UserEntity = organization.users.find(
      (entity: UserEntity) => entity.id === user.id,
    );
    if (!organizationUser)
      throw new BusinessLogicException(
        'El User con el id dado no está asociado a el Organization',
        BusinessError.PRECONDITION_FAILED,
      );
    return organizationUser;
  }

  // Eliminar Miembro de un Organization

  async deleteMemberFromOrganization(organizationId: string, userId: string) {
    const organization: OrganizationEntity =
      await this.findOrganizationById(organizationId);
    const user: UserEntity = await this.findUserById(userId);

    const organizationUser: UserEntity = organization.users.find(
      (entity: UserEntity) => entity.id === user.id,
    );

    if (!organizationUser)
      throw new BusinessLogicException(
        'El User con el id dado no está asociado a el Organization',
        BusinessError.PRECONDITION_FAILED,
      );

    organization.users = organization.users.filter(
      (entity: UserEntity) => entity.id !== userId,
    );
    await this.organizationRepository.save(organization);
  }

  private async findOrganizationById(
    organizationId: string,
  ): Promise<OrganizationEntity> {
    const organization: OrganizationEntity =
      await this.organizationRepository.findOne({
        where: { id: organizationId },
        relations: ['users'],
      });
    if (!organization) {
      throw new BusinessLogicException(
        'El Organization con el id dado no fue encontrado',
        BusinessError.NOT_FOUND,
      );
    }
    return organization;
  }

  private async findUserById(userId: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BusinessLogicException(
        'El User con el id dado no fue encontrado',
        BusinessError.NOT_FOUND,
      );
    }
    return user;
  }
}
