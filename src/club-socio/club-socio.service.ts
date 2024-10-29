import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClubEntity } from '../club/club.entity';
import { Repository } from 'typeorm';
import { SocioEntity } from '../socio/socio.entity';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';

@Injectable()
export class ClubSocioService {
    constructor(
        @InjectRepository(ClubEntity)
        private readonly clubRepository: Repository<ClubEntity>,
        @InjectRepository(SocioEntity)
        private readonly socioRepository: Repository<SocioEntity>,
    ) {}

    // Add a member to a club

    async addMemberToClub(clubId: string, socioId: string,): Promise<ClubEntity> {
        const club: ClubEntity = await this.findClubById(clubId);
        const socio: SocioEntity = await this.findSocioById(socioId);

    club.socios = [...club.socios, socio];
    return await this.clubRepository.save(club);
    }

  // Actualizar Miembros de Un Club

    async updateMembersFromClub(clubId: string, socios: SocioEntity[]): Promise<ClubEntity> {
        const club: ClubEntity = await this.findClubById(clubId);
        for (const socio of socios) {
            await this.findSocioById(socio.id);
        }

        club.socios = socios;
        return await this.clubRepository.save(club);
  }

    // Encontrar Miembros de un Club

    async findMembersFromClub(clubId: string): Promise<SocioEntity[]> {
        const club: ClubEntity = await this.findClubById(clubId);
        return club.socios;
  }

    //  Encontrar Miembro de un Club
    async findMemberFromClub(clubId: string, socioId: string): Promise<SocioEntity> {
        const club: ClubEntity = await this.findClubById(clubId);
        const socio: SocioEntity = await this.findSocioById(socioId);

        const clubSocio: SocioEntity = club.socios.find((entity: SocioEntity) => entity.id === socio.id);
        if (!clubSocio)
            throw new BusinessLogicException(
                'El Socio con el id dado no está asociado a el Club',
                BusinessError.PRECONDITION_FAILED,
         );
    return clubSocio;
  }

  // Eliminar Miembro de un Club

    async deleteMemberFromClub(clubId: string, socioId: string) {
        const club: ClubEntity = await this.findClubById(clubId);
        const socio: SocioEntity = await this.findSocioById(socioId);
        
        const clubSocio: SocioEntity = club.socios.find((entity: SocioEntity) => entity.id === socio.id);
        
        if (!clubSocio)
            throw new BusinessLogicException(
                'El Socio con el id dado no está asociado a el Club',
                BusinessError.PRECONDITION_FAILED,
            );

    club.socios = club.socios.filter((entity: SocioEntity) => entity.id !== socioId);
    await this.clubRepository.save(club);
    
  }

  private async findClubById(
    clubId: string,
  ): Promise<ClubEntity> {
    const club: ClubEntity = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['socios'],
    });
    if (!club) {
      throw new BusinessLogicException(
        'El Club con el id dado no fue encontrado',
        BusinessError.NOT_FOUND,
      );
    }
    return club;
  }

  private async findSocioById(
    socioId: string,
  ): Promise<SocioEntity> {
    const socio: SocioEntity =
      await this.socioRepository.findOne({
        where: { id: socioId },
      });
    if (!socio) {
      throw new BusinessLogicException(
        'El Socio con el id dado no fue encontrado',
        BusinessError.NOT_FOUND,
      );
    }
    return socio;
  }
}