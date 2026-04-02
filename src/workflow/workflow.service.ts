import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowEntity } from './workflow.entity';
import { In, Repository } from 'typeorm';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import validator from 'validator';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { UpdateWorkflowWorkerDto } from './dto/update-workflow-worker.dto';
import { ListWorkflowDto } from './dto/list-workflow.dto';
import { GetWorkflowDto } from './dto/get-workflow.dto';
import { OrganizationEntity } from '../organization/organization.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';
import { SubmissionState } from '../artifact/enums/submission-state.enum';
import { RabbitMQService } from '../messaging/rabbitmq.service';

interface SubmitterInfo {
  username: string;
  email: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowRepository: Repository<WorkflowEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(ArtifactEntity)
    private readonly artifactRepository: Repository<ArtifactEntity>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  private validateId(id: string, fieldName: string): void {
    if (!id || !validator.isUUID(id)) {
      throw new BusinessLogicException(
        `The ${fieldName} provided is not valid`,
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  private async findOrganizationOrThrow(): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.findOne({
      where: {},
    });
    if (!organization) {
      throw new BusinessLogicException(
        'No organization exists in the system',
        BusinessError.NOT_FOUND,
      );
    }
    return organization;
  }

  private async findWorkflowOrThrow(
    id: string,
    includeRelations: boolean = false,
  ): Promise<WorkflowEntity> {
    this.validateId(id, 'workflowId');

    const queryOptions: any = { where: { id } };
    if (includeRelations) {
      queryOptions.relations = ['organization', 'artifacts'];
    }

    const workflow = await this.workflowRepository.findOne(queryOptions);
    if (!workflow) {
      throw new BusinessLogicException(
        'The workflow with the provided id does not exist',
        BusinessError.NOT_FOUND,
      );
    }
    return workflow;
  }

  private async resolveArtifacts(artifactIds?: string[]): Promise<ArtifactEntity[]> {
    if (!artifactIds || artifactIds.length === 0) return [];

    for (const aid of artifactIds) {
      this.validateId(aid, 'artifactId');
    }

    const artifacts = await this.artifactRepository.find({
      where: { id: In(artifactIds) },
    });

    if (artifacts.length !== artifactIds.length) {
      const foundIds = new Set(artifacts.map((a) => a.id));
      const missing = artifactIds.filter((id) => !foundIds.has(id));
      throw new BusinessLogicException(
        `The following artifact IDs do not exist: ${missing.join(', ')}`,
        BusinessError.PRECONDITION_FAILED,
      );
    }
    return artifacts;
  }

  private validateCreateDto(dto: CreateWorkflowDto): void {
    if (!dto.title || dto.title.length < 3) {
      throw new BusinessLogicException(
        'The title of the workflow is required and must be at least 3 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    if (!dto.description || dto.description.length < 50) {
      throw new BusinessLogicException(
        'The description must be at least 50 characters long',
        BusinessError.BAD_REQUEST,
      );
    }

    if (
      !dto.submission_comment ||
      dto.submission_comment.trim().length < 20 ||
      dto.submission_comment.length > 1000
    ) {
      throw new BusinessLogicException(
        'The submission_comment is required and must be between 20 and 1000 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    if (dto.keywords) {
      const totalKeywordsLength = dto.keywords.join('').length;
      if (totalKeywordsLength > 1000) {
        throw new BusinessLogicException(
          'The keywords array can have at most 1000 characters in total',
          BusinessError.BAD_REQUEST,
        );
      }
    }
  }

  private async checkTitleUniqueness(title: string, organization: OrganizationEntity): Promise<void> {
    const existing = await this.workflowRepository.findOne({
      where: { title, organization: { id: organization.id } },
    });
    if (existing) {
      throw new BusinessLogicException(
        'A workflow with this title already exists in the organization',
        BusinessError.PRECONDITION_FAILED,
      );
    }
  }

  async create(
    dto: CreateWorkflowDto,
    submitterInfo: SubmitterInfo,
    correlationId?: string,
  ): Promise<ListWorkflowDto> {
    if (!submitterInfo.email || !validator.isEmail(submitterInfo.email)) {
      throw new BusinessLogicException(
        'Invalid submitter email provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }
    if (!submitterInfo.username || submitterInfo.username.trim() === '') {
      throw new BusinessLogicException(
        'Invalid submitter username provided.',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    this.validateCreateDto(dto);

    const organization = await this.findOrganizationOrThrow();
    await this.checkTitleUniqueness(dto.title, organization);

    const artifacts = await this.resolveArtifacts(dto.artifactIds);

    const newWorkflow = this.workflowRepository.create({
      title: dto.title,
      description: dto.description,
      keywords: dto.keywords || [],
      githubRepositories: dto.githubRepositories || [],
      submission_comment: dto.submission_comment,
      organization,
      artifacts,
      submitterEmail: submitterInfo.email,
      submitterUsername: submitterInfo.username,
      submittedAt: new Date(),
      submissionState: SubmissionState.PENDING,
    });

    const saved = await this.workflowRepository.save(newWorkflow);

    this.rabbitMQService.publishWorkflowSubmit({
      workflowId: saved.id,
      title: saved.title,
      description: saved.description,
      submission_comment: saved.submission_comment,
      keywords: saved.keywords,
      githubRepositories: saved.githubRepositories,
      artifactIds: artifacts.map((a) => a.id),
      contributor: submitterInfo.email,
      ...(correlationId !== undefined && { correlationId }),
    }).catch((err) => {
      this.logger.error(
        `Failed to publish workflow.submit for ${saved.id} [corrId=${correlationId ?? 'none'}]: ${err?.message ?? err}`,
      );
    });

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      keywords: saved.keywords,
      submissionState: saved.submissionState,
      submittedAt: saved.submittedAt,
      updatedAt: saved.updatedAt,
    };
  }

  async findAll(): Promise<ListWorkflowDto[]> {
    const organization = await this.findOrganizationOrThrow();
    const workflows = await this.workflowRepository.find({
      where: { organization: { id: organization.id } },
    });
    return workflows.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      keywords: w.keywords,
      submissionState: w.submissionState,
      submittedAt: w.submittedAt,
      updatedAt: w.updatedAt,
    }));
  }

  async findOne(id: string): Promise<GetWorkflowDto> {
    await this.findOrganizationOrThrow();
    const workflow = await this.findWorkflowOrThrow(id, true);

    return {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      submission_comment: workflow.submission_comment,
      keywords: workflow.keywords,
      githubRepositories: workflow.githubRepositories,
      artifacts: (workflow.artifacts || []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
      })),
      submissionState: workflow.submissionState,
      submitterEmail: workflow.submitterEmail,
      submitterUsername: workflow.submitterUsername,
      submittedAt: workflow.submittedAt,
      updatedAt: workflow.updatedAt,
      blockchainTxId: workflow.blockchainTxId,
      peerId: workflow.peerId,
      submissionError: workflow.submissionError,
      organization: workflow.organization
        ? { name: workflow.organization.name }
        : undefined,
    };
  }

  async updateUser(
    id: string,
    dto: UpdateWorkflowDto,
    contributorEmail?: string,
    correlationId?: string,
  ): Promise<WorkflowEntity> {
    this.validateId(id, 'workflowId');

    if ('title' in dto || 'description' in dto) {
      throw new BusinessLogicException(
        'Cannot update title or description',
        BusinessError.BAD_REQUEST,
      );
    }

    if (
      !dto.submission_comment ||
      dto.submission_comment.trim().length < 20 ||
      dto.submission_comment.length > 1000
    ) {
      throw new BusinessLogicException(
        'The submission_comment is required and must be between 20 and 1000 characters long',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    const workflow = await this.findWorkflowOrThrow(id, true);

    if (dto.keywords !== undefined) {
      const totalKeywordsLength = dto.keywords.join('').length;
      if (totalKeywordsLength > 1000) {
        throw new BusinessLogicException(
          'The keywords array can have at most 1000 characters in total',
          BusinessError.BAD_REQUEST,
        );
      }
      workflow.keywords = dto.keywords;
    }

    if (dto.githubRepositories !== undefined) {
      workflow.githubRepositories = dto.githubRepositories as any;
    }

    if (dto.artifactIds !== undefined) {
      workflow.artifacts = await this.resolveArtifacts(dto.artifactIds);
    }

    workflow.submission_comment = dto.submission_comment;

    const saved = await this.workflowRepository.save(workflow);

    this.rabbitMQService.publishWorkflowUpdate({
      workflowId: id,
      patch: {
        title: workflow.title,
        description: workflow.description,
        submission_comment: dto.submission_comment,
        keywords: workflow.keywords,
        githubRepositories: workflow.githubRepositories,
        artifactIds: (workflow.artifacts || []).map((a) => a.id),
        contributor: contributorEmail,
      },
      contributor: contributorEmail,
      ...(correlationId !== undefined && { correlationId }),
    }).catch((err) => {
      this.logger.error(
        `Failed to publish workflow.update for ${id} [corrId=${correlationId ?? 'none'}]: ${err?.message ?? err}`,
      );
    });

    return saved;
  }

  async updateWorker(id: string, dto: UpdateWorkflowWorkerDto): Promise<WorkflowEntity> {
    const workflow = await this.findWorkflowOrThrow(id);

    const allowedFields = ['submissionState', 'blockchainTxId', 'peerId', 'submissionError', 'updatedAt'];
    const receivedFields = Object.keys(dto);
    const forbiddenFields = receivedFields.filter((f) => !allowedFields.includes(f));
    if (forbiddenFields.length > 0) {
      throw new BusinessLogicException(
        `Cannot update the following fields in status update: ${forbiddenFields.join(', ')}. Only allowed: ${allowedFields.join(', ')}`,
        BusinessError.BAD_REQUEST,
      );
    }

    if (dto.submissionState !== undefined) {
      workflow.submissionState = dto.submissionState;
    }
    if (dto.blockchainTxId) {
      workflow.blockchainTxId = dto.blockchainTxId;
    }
    if (dto.peerId) {
      workflow.peerId = dto.peerId;
    }
    if (dto.submissionError) {
      workflow.submissionError = dto.submissionError;
    }

    if (dto.submissionState === SubmissionState.SUCCESS) {
      if (dto.updatedAt) {
        workflow.updatedAt = new Date(dto.updatedAt);
      }
      workflow.submissionError = null;
    }

    if (dto.submissionState === SubmissionState.FAILED && dto.submissionError) {
      const isUpdateEvent = !!dto.updatedAt;
      const prefix = isUpdateEvent
        ? 'Error updating the workflow. Details: '
        : 'Error submitting the workflow. Details: ';
      workflow.submissionError = `${prefix}${dto.submissionError}`;
    }

    return await this.workflowRepository.save(workflow);
  }
}
