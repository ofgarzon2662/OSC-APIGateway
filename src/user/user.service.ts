import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Obtener todos los users
  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find({ relations: ['organizations'] });
  }

  // Obtener un user por id

  async findOne(id: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepository.findOne({
      where: { id },
      relations: ['organizations'],
    });
    if (!user)
      throw new BusinessLogicException(
        'El user con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    return user;
  }

  // crear un user

  async create(user: UserEntity): Promise<UserEntity> {
    if (!this.isValidEmail(user.email)) {
      throw new BusinessLogicException(
        'El email proporcionado no es válido',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    return await this.userRepository.save(user);
  }

  // Actualizar un user

  async update(id: string, user: UserEntity): Promise<UserEntity> {
    const userToUpdate: UserEntity = await this.userRepository.findOne({
      where: { id },
    });
    if (!userToUpdate)
      throw new BusinessLogicException(
        'El user con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    if (!this.isValidEmail(user.email)) {
      throw new BusinessLogicException(
        'El email proporcionado no es válido',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    return await this.userRepository.save(user);
  }

  // Eliminar un user

  async delete(id: string) {
    const user: UserEntity = await this.userRepository.findOne({
      where: { id },
    });
    if (!user)
      throw new BusinessLogicException(
        'El user con el id provisto no existe',
        BusinessError.NOT_FOUND,
      );

    await this.userRepository.remove(user);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
