import { ClubEntity } from '../club/club.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SocioEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    nombre: string;
    
    @Column()
    email: string;
    
    @Column()
    fechaNacimiento: Date;

    @ManyToMany(
        () => ClubEntity,
        (club: ClubEntity) => club.socios,
      )
      clubs: ClubEntity[];
    }
