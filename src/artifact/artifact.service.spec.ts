import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { faker } from '@faker-js/faker';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { SubmissionState } from './enums/submission-state.enum';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { OrganizationEntity } from '../organization/organization.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';

describe('ArtifactService', () => {
  let service: ArtifactService;
  let artifactRepository: Repository<ArtifactEntity>;
  let organizationRepository: Repository<OrganizationEntity>;
  let artifactList: ArtifactEntity[];
  let organization: OrganizationEntity;

  // Helper function to generate a random artifact
  const generateRandomArtifact = (organizationId: string): CreateArtifactDto => {
    return {
      title: faker.lorem.words(3),
      description: faker.lorem.paragraphs(2),
      keywords: [faker.lorem.word(), faker.lorem.word()],
      links: [faker.internet.url(), faker.internet.url()],
      dois: [],
      fundingAgencies: [],
      acknowledgements: '',
      fileName: faker.system.fileName(),
      hash: faker.string.alphanumeric(64),
      organizationId: organizationId,
      submissionState: SubmissionState.PENDING,
      verified: false,
      lastTimeVerified: null,
      submittedAt: null
    };
  };

  // Helper function to generate a random organization
  const generateRandomOrganization = () => {
    return {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [ArtifactService],
    }).compile();

    service = module.get<ArtifactService>(ArtifactService);
    artifactRepository = module.get<Repository<ArtifactEntity>>(
      getRepositoryToken(ArtifactEntity),
    );
    organizationRepository = module.get<Repository<OrganizationEntity>>(
      getRepositoryToken(OrganizationEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await artifactRepository.clear();
    await organizationRepository.clear();
    artifactList = [];

    // Create a single organization for testing
    const organizationData = generateRandomOrganization();
    organization = await organizationRepository.save(organizationData);

    // Create 5 artifacts for testing
    const testEmailForSeeding = 'seed@example.com'; // Use a specific email for seeding
    for (let i = 0; i < 5; i++) {
      const artifactDto = generateRandomArtifact(organization.id);
      // Pass the test email when seeding the database via the service
      const newArtifact = await service.create(artifactDto, testEmailForSeeding);
      artifactList.push(newArtifact);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // FIND ALL TESTS
  describe('findAll', () => {
    it('should return all artifacts with only title, submitterEmail, and organizationName', async () => {
      const artifacts = await service.findAll();
      expect(artifacts).toBeDefined();
      expect(artifacts).not.toBeNull();
      expect(artifacts).toHaveLength(artifactList.length);
      
      // Verify each artifact has only the expected fields
      artifacts.forEach((artifact, index) => {
        const dbArtifact = artifactList[index];
        expect(artifact).toEqual({
          id: dbArtifact.id,
          title: dbArtifact.title,
          submitterEmail: dbArtifact.submitterEmail,
          organizationName: dbArtifact.organization.name
        });
      });
    });
  });

  // FIND ONE TESTS
  describe('findOne', () => {
    it('should return one artifact by id', async () => {
      const storedArtifact = artifactList[0];
      const artifact = await service.findOne(storedArtifact.id);
      expect(artifact).toBeDefined();
      expect(artifact).toEqual({
        id: storedArtifact.id,
        title: storedArtifact.title,
        submitterEmail: storedArtifact.submitterEmail,
        organizationName: storedArtifact.organization.name
      });
    });

    it('should throw an exception for an invalid UUID', async () => {
      await expect(() => service.findOne('invalid-uuid')).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(() => service.findOne(nonExistentId)).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });
  });

  // CREATE TESTS
  describe('create', () => {
    const testEmail = 'test@example.com'; // Define a consistent test email

    it('should create a new artifact with valid data', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // Remove submitterEmail from the generated DTO if it exists
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      
      const newArtifact = await service.create(artifactDto, testEmail);
      expect(newArtifact).toBeDefined();
      expect(newArtifact.id).toBeDefined();
      expect(newArtifact.title).toBe(artifactDto.title);
      expect(newArtifact.description).toBe(artifactDto.description);
      expect(newArtifact.submitterEmail).toBe(testEmail); // Verify the email was set
      expect(newArtifact.organization.name).toBe(organization.name);
    });

    it('should throw an exception for an invalid submitter email', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      const invalidEmail = 'not-an-email';
      await expect(() => service.create(artifactDto, invalidEmail)).rejects.toHaveProperty(
        'message',
        'Invalid submitter email provided.'
      );
    });

    it('should throw an exception for a title that is too short', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.title = 'ab'; // Less than 3 characters
      await expect(() => service.create(artifactDto, testEmail)).rejects.toHaveProperty(
        'message',
        'The title of the artifact is required and must be at least 3 characters long',
      );
    });

    it('should throw an exception for a description that is too short', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.description = 'short'; // Less than 50 characters
      await expect(() => service.create(artifactDto, testEmail)).rejects.toHaveProperty(
        'message',
        'The description must be at least 50 characters long',
      );
    });

    it('should throw an exception for keywords exceeding total length', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.keywords = Array(1001).fill('keyword'); // Exceeds 1000 characters
      await expect(() => service.create(artifactDto, testEmail)).rejects.toHaveProperty(
        'message',
        'The keywords array can have at most 1000 characters in total',
      );
    });

    it('should throw an exception for links exceeding total length', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.links = Array(2001).fill('https://example.com'); // Exceeds 2000 characters
      await expect(() => service.create(artifactDto, testEmail)).rejects.toHaveProperty(
        'message',
        'The links array can have at most 2000 characters in total',
      );
    });

    it('should throw an exception for invalid URLs in links', async () => {
      const artifactDto = generateRandomArtifact(organization.id);
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.links = ['invalid-url'];
      await expect(() => service.create(artifactDto, testEmail)).rejects.toHaveProperty(
        'message',
        'Each link in the links array must be a valid URL',
      );
    });
  });

  // UPDATE TESTS
  describe('update', () => {
    it('should update an artifact with all allowed fields', async () => {
      const storedArtifact = artifactList[0];
      const updateData: UpdateArtifactDto = {
        verified: true,
        lastTimeVerified: new Date(),
        submissionState: SubmissionState.SUCCESS,
        submittedAt: new Date()
      };
      const updatedArtifact = await service.update(storedArtifact.id, updateData);
      expect(updatedArtifact).toBeDefined();
      expect(updatedArtifact.verified).toBe(updateData.verified);
      expect(updatedArtifact.lastTimeVerified).toEqual(updateData.lastTimeVerified);
      expect(updatedArtifact.submissionState).toBe(updateData.submissionState);
      expect(updatedArtifact.submittedAt).toEqual(updateData.submittedAt);
    });

    it('should update an artifact with partial allowed fields', async () => {
      const storedArtifact = artifactList[1];
      const updateData: UpdateArtifactDto = {
        verified: true
      };
      const updatedArtifact = await service.update(storedArtifact.id, updateData);
      expect(updatedArtifact).toBeDefined();
      expect(updatedArtifact.verified).toBe(updateData.verified);
    });

    it('should throw BusinessLogicException when trying to update non-allowed fields', async () => {
      const storedArtifact = artifactList[0];
      const updateData = {
        title: 'New Title',
        contributor: 'New Contributor',
        description: 'New Description'
      };
      await expect(() => service.update(storedArtifact.id, updateData as UpdateArtifactDto)).rejects.toHaveProperty(
        'message',
        'Cannot update title, contributor, or submittedAt fields',
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      const updateData: UpdateArtifactDto = {
        verified: true
      };
      await expect(() => service.update(nonExistentId, updateData)).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      const invalidId = 'invalid-uuid';
      const updateData: UpdateArtifactDto = {
        verified: true
      };
      await expect(() => service.update(invalidId, updateData)).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });
  });

  // DELETE TESTS
  describe('delete', () => {
    it('should delete an existing artifact', async () => {
      const storedArtifact = artifactList[0];
      await service.delete(storedArtifact.id);
      const deletedArtifact = await artifactRepository.findOne({
        where: { id: storedArtifact.id },
      });
      expect(deletedArtifact).toBeNull();
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(() => service.delete(nonExistentId)).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      const invalidId = 'invalid-uuid';
      await expect(() => service.delete(invalidId)).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });
  });
});
