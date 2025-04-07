import { OrganizationEntity } from '../organization/organization.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsDate, IsArray, IsUrl, IsEmail, IsBoolean, IsEnum, Length, Matches, IsOptional } from 'class-validator';
import { SubmissionState } from './enums/submission-state.enum';

@Entity()
export class ArtifactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  @Length(50, 3000)
  description: string;

  @Column({ type: 'simple-array' })
  @IsArray()
  @IsString({ each: true })
  @Length(0, 1000)
  keywords: string[];

  @Column({ type: 'simple-array' })
  @IsArray()
  @IsUrl({}, { each: true })
  @Length(0, 2000)
  links: string[];

  @Column({ type: 'simple-array' })
  @IsArray()
  @IsString({ each: true })
  @Length(0, 4)
  @Matches(/^10\.\d{4,9}\/[-._;()/:\w]+$/, { each: true })
  dois: string[];

  @Column({ type: 'simple-array' })
  @IsArray()
  @IsString({ each: true })
  @Length(0, 100)
  fundingAgencies: string[];

  @Column({ type: 'text' })
  @IsString()
  @IsOptional()
  @Length(0, 3000)
  acknowledgements: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  fileName: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/)
  hash: string;

  @Column({ default: false })
  @IsBoolean()
  verified: boolean;

  @Column({ type: 'datetime', nullable: true })
  @IsDate()
  @IsOptional()
  lastTimeVerified: Date;

  @Column({
    type: 'text',
    enum: SubmissionState,
    default: SubmissionState.PENDING
  })
  @IsEnum(SubmissionState)
  submissionState: SubmissionState;

  @Column()
  @IsEmail()
  @IsNotEmpty()
  submitterEmail: string;

  @Column({ type: 'datetime', nullable: true })
  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.artifacts,
    { 
      onDelete: 'CASCADE',
      nullable: false
    }
  )
  @IsNotEmpty()
  organization: OrganizationEntity;
}
