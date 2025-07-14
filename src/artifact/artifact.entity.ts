import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsArray,
  IsUrl,
  IsEmail,
  IsBoolean,
  IsEnum,
  Length,
  Matches,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { SubmissionState } from './enums/submission-state.enum';
import { Type } from 'class-transformer';

export class ManifestItem {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/)
  hash: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  algorithm: string;
}

@Entity()
export class ArtifactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /* --------------- Core fields --------------- */

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
  @Matches(/^10\.\d{4,9}\/[-_.;()/:]\w+$/, { each: true })
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

  @Column({ type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', default: '[]' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManifestItem)
  manifest: ManifestItem[];

  /* --------------- States & dates --------------- */

  @Column({ default: false })
  @IsBoolean()
  verified: boolean;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  lastTimeVerified: Date;

  @Column({
    type: 'text',
    enum: SubmissionState,
    default: SubmissionState.PENDING,
  })
  @IsEnum(SubmissionState)
  submissionState: SubmissionState;

  @Column()
  @IsEmail()
  @IsNotEmpty()
  submitterEmail: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  submitterUsername: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /* --------------- Blockchain fields --------------- */

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  blockchainTxId?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  peerId?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  submissionError?: string;

  /* --------------- Relationship --------------- */

  @ManyToOne(
    () => require('../organization/organization.entity').OrganizationEntity,
    (org: any) => org.artifacts,
    { onDelete: 'CASCADE', nullable: false },
  )
  @IsNotEmpty()
  organization: any;
}
