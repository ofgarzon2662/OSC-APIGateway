import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';
import { OrganizationEntity } from '../organization/organization.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  // Get All Users
  async findAll(organizationId): Promise<UserEntity[]> {
    if (!organizationId) {
      throw new BusinessLogicException(
        'The organizationId provided is missing',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // The organizationId should be a valid UUID
    if (!validator.isUUID(organizationId))
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    // Check if the organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    return await this.userRepository.find({ relations: ['organization'] });
  }

  // Get One User

  async findOne(orgId: string, userId: string): Promise<UserEntity> {
    // Check orgId is a valid UUID
    if (!validator.isUUID(orgId)) {
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // Check userId is a valid UUID
    if (!validator.isUUID(userId)) {
      throw new BusinessLogicException(
        'The userId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // Check if the organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: orgId },
    });
    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    // check that the user is part of the organization
    const user: UserEntity = await this.userRepository.findOne({
      where: { id: userId, organization },
      relations: ['organization'],
    });
    if (!user)
      throw new BusinessLogicException(
        'The user with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    return user;
  }

  // Create one User

  async create(
    user: Partial<UserEntity>,
    organizationId: string,
  ): Promise<UserEntity> {
    if (!organizationId) {
      throw new BusinessLogicException(
        'The organizationId provided is missing',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    // The organizationId should be a valid UUID
    if (!validator.isUUID(organizationId))
      throw new BusinessLogicException(
        'The organizationId provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    // Check if the organization exists and assign it
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    if (!this.isValidEmail(user.email)) {
      throw new BusinessLogicException(
        'The email provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    // Email and Username of User should be unique
    const existingUser: UserEntity = await this.userRepository.findOne({
      where: { username: user.username },
    });
    const existingEmail: UserEntity = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (existingUser || existingEmail)
      throw new BusinessLogicException(
        'The email or username provided is already in use',
        BusinessError.BAD_REQUEST,
      );
    // Create the User and save it
    const newUser = this.userRepository.create({
      ...user,
      organization,
    });
    return await this.userRepository.save(newUser);
  }

  // Update a User

  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    // Find the user to update
    const userToUpdate: UserEntity = await this.userRepository.findOne({
      where: { id },
    });
    if (!userToUpdate) {
      throw new BusinessLogicException(
        'The User with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    // Validate and check uniqueness of email if it's being updated
    if (user.email && user.email !== userToUpdate.email) {
      if (!this.isValidEmail(user.email)) {
        throw new BusinessLogicException(
          'The email provided is not valid',
          BusinessError.PRECONDITION_FAILED,
        );
      }
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: user.email },
      });
      if (existingEmailUser && existingEmailUser.id !== id) {
        throw new BusinessLogicException(
          'The email provided is already in use',
          BusinessError.BAD_REQUEST,
        );
      }
    }

    // Check uniqueness of username if it's being updated
    if (user.username && user.username !== userToUpdate.username) {
      const existingUsernameUser = await this.userRepository.findOne({
        where: { username: user.username },
      });
      if (existingUsernameUser && existingUsernameUser.id !== id) {
        throw new BusinessLogicException(
          'The username provided is already in use',
          BusinessError.BAD_REQUEST,
        );
      }
    }

    // Merge the updated fields into the existing user
    Object.assign(userToUpdate, user);

    // Save the updated user
    return await this.userRepository.save(userToUpdate);
  }

  // Delete a User

  async delete(id: string) {
    const user: UserEntity = await this.userRepository.findOne({
      where: { id },
    });
    if (!user)
      throw new BusinessLogicException(
        'The User with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    await this.userRepository.remove(user);
  }

  async deleteAll(organizationId: string): Promise<void> {
    // Validate organization ID
    if (!organizationId) {
      throw new BusinessLogicException(
        'The organizationId provided is missing',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BusinessLogicException(
        'The organization provided does not exist',
        BusinessError.NOT_FOUND,
      );
    }

    const users = await this.userRepository.find({
      where: { organization: { id: organizationId } },
    });

    // Remove all users
    await this.userRepository.remove(users);
  }

  private isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }
}

// Delete all users
