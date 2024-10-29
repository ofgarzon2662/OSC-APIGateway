import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { ClubEntity } from './club.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';

@Injectable()
export class ClubService {
    constructor(
        @InjectRepository(ClubEntity)
        private readonly clubRepository: Repository<ClubEntity>,
    ) {}

    // Obtener todos los clubes
    async findAll(): Promise<ClubEntity[]> {
        return await this.clubRepository.find({ relations: ['socios'] });
    }

    // Obtener un club por id

    async findOne(id: string): Promise<ClubEntity> {
        const club: ClubEntity = await this.clubRepository.findOne({where: {id}, relations: ["socios"] } );
        if (!club)
          throw new BusinessLogicException("El club con el id provisto no existe", BusinessError.NOT_FOUND);
    
        return club;
    }

    // crear un club

    async create(club: ClubEntity): Promise<ClubEntity> {
        if (club.descripcion.length > 100) {
            throw new BusinessLogicException("La descripción no puede tener más de 100 caracteres", BusinessError.BAD_REQUEST);
            }
        return await this.clubRepository.save(club);
    }

    // Actualizar un club

    async update(id: string, club: ClubEntity): Promise<ClubEntity> {
        const clubToUpdate: ClubEntity = await this.clubRepository.findOne({where: {id}});
        if (!clubToUpdate)
          throw new BusinessLogicException("El club con el id provisto no existe", BusinessError.NOT_FOUND);
        
        if (club.descripcion.length > 100) {
            throw new BusinessLogicException("La descripción no puede tener más de 100 caracteres", BusinessError.BAD_REQUEST);
        }
    
        return await this.clubRepository.save(club);
    }

    // Eliminar un club

    async delete(id: string) {
        const club: ClubEntity = await this.clubRepository.findOne({where:{id}});
        if (!club)
          throw new BusinessLogicException("El club con el id provisto no existe", BusinessError.NOT_FOUND);
      
        await this.clubRepository.remove(club);
    }
}
