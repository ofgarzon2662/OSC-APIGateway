import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Get All Users
  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find({ relations: ['organization'] });
  }

  // Get One User

  async findOne(id: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({
      where: { id },
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

  async create(user: UserEntity): Promise<UserEntity> {
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
    return await this.userRepository.save(user);
  }

  // Update a User

  async update(id: string, user: UserEntity): Promise<UserEntity> {
    const userToUpdate: UserEntity = await this.userRepository.findOne({
      where: { id },
    });
    if (!userToUpdate)
      throw new BusinessLogicException(
        'The User with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );

    if (!this.isValidEmail(user.email)) {
      throw new BusinessLogicException(
        'The email provided is not valid',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    return await this.userRepository.save(user);
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

  private isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }
}
