import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SocioEntity } from './socio.entity';
import { Repository } from 'typeorm/repository/Repository';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';

@Injectable()
export class SocioService {
    constructor(
        @InjectRepository(SocioEntity)
        private readonly socioRepository: Repository<SocioEntity>
    ) {}

    // Obtener todos los socios
    async findAll(): Promise<SocioEntity[]> {
        return await this.socioRepository.find( { relations: ["clubs"] });
    }

    // Obtener un socio por id

    async findOne(id: string): Promise<SocioEntity> {
        const socio: SocioEntity = await this.socioRepository.findOne({where: {id}, relations: ["clubs"] } );
        if (!socio)
          throw new BusinessLogicException("El socio con el id provisto no existe", BusinessError.NOT_FOUND);
    
        return socio;
    }

    // crear un socio

    async create(socio: SocioEntity): Promise<SocioEntity> {
        if (!this.isValidEmail(socio.email)) {
            throw new BusinessLogicException(
                "El email proporcionado no es válido",
                BusinessError.PRECONDITION_FAILED
            );
        }
        return await this.socioRepository.save(socio);
    }

    // Actualizar un socio

    async update(id: string, socio: SocioEntity): Promise<SocioEntity> {
        const socioToUpdate: SocioEntity = await this.socioRepository.findOne({where: {id}});
        if (!socioToUpdate)
          throw new BusinessLogicException("El socio con el id provisto no existe", BusinessError.NOT_FOUND);
        
        if (!this.isValidEmail(socio.email)) {
            throw new BusinessLogicException(
                "El email proporcionado no es válido",
                BusinessError.PRECONDITION_FAILED
            );
        }
    
        return await this.socioRepository.save(socio);
    }

    // Eliminar un socio

    async delete(id: string) {
        const socio: SocioEntity = await this.socioRepository.findOne({where:{id}});
        if (!socio)
          throw new BusinessLogicException("El socio con el id provisto no existe", BusinessError.NOT_FOUND);
      
        await this.socioRepository.remove(socio);
    }
    
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }


}
