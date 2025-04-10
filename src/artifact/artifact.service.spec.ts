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
  function generateRandomArtifact(): CreateArtifactDto {
    return {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription() + ' ' + faker.commerce.productDescription() + ' ' + faker.commerce.productDescription(),
      keywords: [faker.commerce.department(), faker.commerce.department()],
      links: [faker.internet.url()],
      dois: [],
      fundingAgencies: [],
      acknowledgements: faker.lorem.sentence(),
      fileName: faker.system.fileName(),
      hash: faker.string.alphanumeric(64),
    };
  }

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
      const artifactDto = generateRandomArtifact();
      // Pass the test email when seeding the database via the service
      const createdArtifact = await service.create(artifactDto, testEmailForSeeding, organization.id);
      
      // Fetch the full artifact entity to store in artifactList
      const fullArtifact = await artifactRepository.findOne({
        where: { id: createdArtifact.id },
        relations: ['organization']
      });
      
      if (fullArtifact) {
        artifactList.push(fullArtifact);
      }
    }

    return artifactList;
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // FIND ALL TESTS
  describe('findAll', () => {
    it('should return all artifacts with minimal fields for a valid organization', async () => {
      const artifacts = await service.findAll(organization.id);
      expect(artifacts).toBeDefined();
      expect(artifacts.length).toBe(artifactList.length);
      
      artifacts.forEach((artifact, index) => {
        const dbArtifact = artifactList[index];
        expect(artifact).toEqual({
          id: dbArtifact.id,
          title: dbArtifact.title,
          description: dbArtifact.description,
          lastTimeVerified: dbArtifact.lastTimeVerified
        });
      });
    });

    it('should throw an exception for an invalid organization ID', async () => {
      await expect(() => service.findAll('invalid-uuid')).rejects.toHaveProperty(
        'message',
        'The organizationId provided is not valid',
      );
    });

    it('should throw an exception for a non-existent organization', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(() => service.findAll(nonExistentId)).rejects.toHaveProperty(
        'message',
        'The organization with the provided id does not exist',
      );
    });
  });

  // FIND ONE TESTS
  describe('findOne', () => {
    it('should return one artifact by id with all fields for a valid organization', async () => {
      const storedArtifact = artifactList[0];
      const artifact = await service.findOne(storedArtifact.id, organization.id);
      expect(artifact).toBeDefined();
      expect(artifact).toEqual({
        id: storedArtifact.id,
        title: storedArtifact.title,
        description: storedArtifact.description,
        keywords: storedArtifact.keywords,
        links: storedArtifact.links,
        dois: storedArtifact.dois,
        fundingAgencies: storedArtifact.fundingAgencies,
        acknowledgements: storedArtifact.acknowledgements,
        fileName: storedArtifact.fileName,
        hash: storedArtifact.hash,
        verified: storedArtifact.verified,
        lastTimeVerified: storedArtifact.lastTimeVerified,
        submissionState: storedArtifact.submissionState,
        submitterEmail: storedArtifact.submitterEmail,
        submittedAt: storedArtifact.submittedAt,
        organization: {
          name: storedArtifact.organization.name
        }
      });
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      await expect(() => service.findOne('invalid-uuid', organization.id)).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid',
      );
    });

    it('should throw an exception for an invalid organization ID', async () => {
      const storedArtifact = artifactList[0];
      await expect(() => service.findOne(storedArtifact.id, 'invalid-uuid')).rejects.toHaveProperty(
        'message',
        'The organizationId provided is not valid',
      );
    });

    it('should throw an exception for a non-existent organization', async () => {
      const storedArtifact = artifactList[0];
      const nonExistentId = faker.string.uuid();
      await expect(() => service.findOne(storedArtifact.id, nonExistentId)).rejects.toHaveProperty(
        'message',
        'The organization with the provided id does not exist',
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(() => service.findOne(nonExistentId, organization.id)).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist',
      );
    });
  });

  // CREATE TESTS
  describe('create', () => {
    const testEmail = 'test@example.com'; // Define a consistent test email

    it('should create a new artifact with valid data', async () => {
      const artifactDto = generateRandomArtifact();
      
      const newArtifact = await service.create(artifactDto, testEmail, organization.id);
      expect(newArtifact).toBeDefined();
      expect(newArtifact).toEqual({
        id: expect.any(String),
        title: artifactDto.title,
        description: artifactDto.description,
        lastTimeVerified: null
      });
    });

    it('should throw an exception for an invalid submitter email', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      const invalidEmail = 'not-an-email';
      await expect(() => service.create(artifactDto, invalidEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'Invalid submitter email provided.',
      );
    });

    it('should throw an exception for a title that is too short', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.title = 'ab'; // Less than 3 characters
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'The title of the artifact is required and must be at least 3 characters long',
      );
    });

    it('should throw an exception for a description that is too short', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.description = 'short'; // Less than 50 characters
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'The description must be at least 50 characters long',
      );
    });

    it('should throw an exception for keywords exceeding total length', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.keywords = Array(1001).fill('keyword'); // Exceeds 1000 characters
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'The keywords array can have at most 1000 characters in total',
      );
    });

    it('should throw an exception for links exceeding total length', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.links = Array(2001).fill('https://example.com'); // Exceeds 2000 characters
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'The links array can have at most 2000 characters in total',
      );
    });

    it('should throw an exception for invalid URLs in links', async () => {
      const artifactDto = generateRandomArtifact();
      // delete (artifactDto as any).submitterEmail; // REMOVED - No longer needed
      artifactDto.links = ['invalid-url'];
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'Each link in the links array must be a valid URL',
      );
    });

    it('should throw an exception when creating an artifact with a duplicate title in the same organization', async () => {
      const artifactDto = generateRandomArtifact();
      // Create first artifact
      await service.create(artifactDto, testEmail, organization.id);
      
      // Try to create another artifact with the same title
      await expect(() => service.create(artifactDto, testEmail, organization.id)).rejects.toHaveProperty(
        'message',
        'An artifact with this title already exists in the organization',
      );
    });
  });

  // UPDATE TESTS
  describe('update', () => {
    it('should update an artifact', async () => {
      const artifacts = await seedDatabase();
      const updateDto: UpdateArtifactDto = {
        verified: true,
        lastTimeVerified: new Date(),
        submissionState: SubmissionState.SUCCESS,
        submittedAt: new Date()
      };

      const updated = await service.update(artifacts[0].id, updateDto, organization.id);
      expect(updated.verified).toBe(updateDto.verified);
      expect(updated.lastTimeVerified).toEqual(updateDto.lastTimeVerified);
      expect(updated.submissionState).toBe(updateDto.submissionState);
      expect(updated.submittedAt).toEqual(updateDto.submittedAt);
    });

    it('should throw an exception if artifact not found', async () => {
      const updateDto: UpdateArtifactDto = {
        verified: true
      };

      await expect(() => service.update('non-existent-id', updateDto, organization.id))
        .rejects
        .toHaveProperty('message', 'The artifactId provided is not valid');
    });

    it('should throw an exception if organization not found', async () => {
      const artifacts = await seedDatabase();
      const updateDto: UpdateArtifactDto = {
        verified: true
      };

      await expect(() => service.update(artifacts[0].id, updateDto, 'non-existent-org'))
        .rejects
        .toHaveProperty('message', 'The organizationId provided is not valid');
    });

    it('should throw an exception if artifact belongs to different organization', async () => {
      const artifacts = await seedDatabase();
      const otherOrg = await organizationRepository.save({
        name: 'Other Org',
        description: 'Other Org Description'
      });
      const updateDto: UpdateArtifactDto = {
        verified: true
      };

      await expect(() => service.update(artifacts[0].id, updateDto, otherOrg.id))
        .rejects
        .toHaveProperty('message', 'The artifact with the provided id does not exist');
    });
  });

  // DELETE TESTS
  describe('delete', () => {
    it('should delete an artifact', async () => {
      const artifacts = await seedDatabase();
      await service.delete(artifacts[0].id, organization.id);
      const deleted = await artifactRepository.findOne({ where: { id: artifacts[0].id } });
      expect(deleted).toBeNull();
    });

    it('should throw an exception if artifact not found', async () => {
      await expect(() => service.delete('non-existent-id', organization.id))
        .rejects
        .toHaveProperty('message', 'The artifactId provided is not valid');
    });

    it('should throw an exception if organization not found', async () => {
      const artifacts = await seedDatabase();
      await expect(() => service.delete(artifacts[0].id, 'non-existent-org'))
        .rejects
        .toHaveProperty('message', 'The organizationId provided is not valid');
    });

    it('should throw an exception if artifact belongs to different organization', async () => {
      const artifacts = await seedDatabase();
      const otherOrg = await organizationRepository.save({
        name: 'Other Org',
        description: 'Other Org Description'
      });

      await expect(() => service.delete(artifacts[0].id, otherOrg.id))
        .rejects
        .toHaveProperty('message', 'The artifact with the provided id does not exist');
    });
  });
});
