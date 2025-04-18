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
  
  // Test submitter info
  const testSubmitter = {
    username: 'test_user',
    email: 'test@example.com'
  };

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
    for (let i = 0; i < 5; i++) {
      const artifactDto = generateRandomArtifact();
      // Create the artifact directly to avoid calling service during test setup
      const artifact = artifactRepository.create({
        ...artifactDto,
        organization,
        submitterEmail: testSubmitter.email,
        submitterUsername: testSubmitter.username,
        submissionState: SubmissionState.PENDING
      });
      
      const savedArtifact = await artifactRepository.save(artifact);
      artifactList.push(savedArtifact);
    }

    return artifactList;
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // FIND ALL TESTS
  describe('findAll', () => {
    it('should return all artifacts with minimal fields', async () => {
      const artifacts = await service.findAll();
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

    it('should throw an exception when no organization exists', async () => {
      // Clear the organization to test the case when no org exists
      await organizationRepository.clear();
      
      await expect(service.findAll()).rejects.toHaveProperty(
        'message',
        'No organization exists in the system',
      );
    });
  });

  // FIND ONE TESTS
  describe('findOne', () => {
    it('should return one artifact by id with all fields', async () => {
      const storedArtifact = artifactList[0];
      
      // Need to load the artifact with relations to get organization
      const fullArtifact = await artifactRepository.findOne({
        where: { id: storedArtifact.id },
        relations: ['organization']
      });
      
      const artifact = await service.findOne(storedArtifact.id);
      expect(artifact).toBeDefined();
      expect(artifact.id).toEqual(fullArtifact.id);
      expect(artifact.title).toEqual(fullArtifact.title);
      expect(artifact.description).toEqual(fullArtifact.description);
      expect(artifact.submitterEmail).toEqual(testSubmitter.email);
      expect(artifact.submitterUsername).toEqual(testSubmitter.username);
      expect(artifact.organization.name).toEqual(organization.name);
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      await expect(service.findOne('invalid-uuid')).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid',
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(service.findOne(nonExistentId)).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist',
      );
    });

    it('should throw an exception when no organization exists', async () => {
      // Save the ID first
      const artifactId = artifactList[0].id;
      
      // Clear the organization to test the case when no org exists
      await organizationRepository.clear();
      
      await expect(service.findOne(artifactId)).rejects.toHaveProperty(
        'message',
        'No organization exists in the system',
      );
    });
  });

  // CREATE TESTS
  describe('create', () => {
    it('should create a new artifact with valid data', async () => {
      const artifactDto = generateRandomArtifact();
      
      const newArtifact = await service.create(artifactDto, testSubmitter);
      expect(newArtifact).toBeDefined();
      expect(newArtifact).toEqual({
        id: expect.any(String),
        title: artifactDto.title,
        description: artifactDto.description,
        lastTimeVerified: null
      });
      
      // Verify it's saved in the database
      const savedArtifact = await artifactRepository.findOne({ 
        where: { id: newArtifact.id },
        relations: ['organization']
      });
      expect(savedArtifact).toBeDefined();
      expect(savedArtifact.submitterEmail).toBe(testSubmitter.email);
      expect(savedArtifact.submitterUsername).toBe(testSubmitter.username);
      expect(savedArtifact.organization.id).toBe(organization.id);
    });

    it('should throw an exception for invalid email', async () => {
      const artifactDto = generateRandomArtifact();
      const invalidSubmitter = { 
        username: 'testuser',
        email: 'invalid-email' 
      };
      
      await expect(service.create(artifactDto, invalidSubmitter)).rejects.toHaveProperty(
        'message',
        'Invalid submitter email provided.',
      );
    });

    it('should throw an exception for empty username', async () => {
      const artifactDto = generateRandomArtifact();
      const invalidSubmitter = {
        username: '',
        email: 'valid@example.com'
      };
      
      await expect(service.create(artifactDto, invalidSubmitter)).rejects.toHaveProperty(
        'message',
        'Invalid submitter username provided.',
      );
    });

    it('should throw an exception for short title', async () => {
      const artifactDto = generateRandomArtifact();
      artifactDto.title = 'Ab'; // Too short
      await expect(service.create(artifactDto, testSubmitter)).rejects.toHaveProperty(
        'message',
        'The title of the artifact is required and must be at least 3 characters long',
      );
    });

    it('should throw an exception for short description', async () => {
      const artifactDto = generateRandomArtifact();
      artifactDto.description = 'Too short description';
      await expect(service.create(artifactDto, testSubmitter)).rejects.toHaveProperty(
        'message',
        'The description must be at least 50 characters long',
      );
    });

    it('should throw an exception for existing title', async () => {
      // Use the title of an existing artifact
      const existingArtifact = artifactList[0];
      const artifactDto = generateRandomArtifact();
      artifactDto.title = existingArtifact.title;
      
      await expect(service.create(artifactDto, testSubmitter)).rejects.toHaveProperty(
        'message',
        'An artifact with this title already exists in the organization',
      );
    });

    it('should throw an exception when no organization exists', async () => {
      // Clear the organization to test the case when no org exists
      await organizationRepository.clear();
      
      const artifactDto = generateRandomArtifact();
      await expect(service.create(artifactDto, testSubmitter)).rejects.toHaveProperty(
        'message',
        'No organization exists in the system',
      );
    });
  });

  // UPDATE TESTS
  describe('update', () => {
    it('should update an artifact with valid data', async () => {
      const storedArtifact = artifactList[0];
      const updateDto = new UpdateArtifactDto();
      updateDto.verified = true;
      updateDto.lastTimeVerified = new Date();
      
      const updatedArtifact = await service.update(storedArtifact.id, updateDto);
      expect(updatedArtifact).toBeDefined();
      expect(updatedArtifact.verified).toBe(true);
      expect(updatedArtifact.lastTimeVerified).toEqual(updateDto.lastTimeVerified);
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      const updateDto = new UpdateArtifactDto();
      updateDto.verified = true;
      
      await expect(service.update('invalid-uuid', updateDto)).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid',
      );
    });

    it('should throw an exception when trying to update restricted fields', async () => {
      const storedArtifact = artifactList[0];
      const updateDto = {
        title: 'New Title', // This should be rejected
      } as UpdateArtifactDto;
      
      await expect(service.update(storedArtifact.id, updateDto)).rejects.toHaveProperty(
        'message',
        'Cannot update title, contributor, or submittedAt fields',
      );
    });

    it('should throw an exception when no organization exists', async () => {
      // Save the ID first
      const artifactId = artifactList[0].id;
      const updateDto = new UpdateArtifactDto();
      updateDto.verified = true;
      
      // Clear the organization to test the case when no org exists
      await organizationRepository.clear();
      
      await expect(service.update(artifactId, updateDto)).rejects.toHaveProperty(
        'message',
        'No organization exists in the system',
      );
    });
  });

  // DELETE TESTS
  describe('delete', () => {
    it('should delete an artifact', async () => {
      const storedArtifact = artifactList[0];
      await service.delete(storedArtifact.id);
      
      // Verify it's gone from the database
      const deletedArtifact = await artifactRepository.findOne({ where: { id: storedArtifact.id } });
      expect(deletedArtifact).toBeNull();
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      await expect(service.delete('invalid-uuid')).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid',
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      const nonExistentId = faker.string.uuid();
      await expect(service.delete(nonExistentId)).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist',
      );
    });

    it('should throw an exception when no organization exists', async () => {
      // Save the ID first
      const artifactId = artifactList[0].id;
      
      // Clear the organization to test the case when no org exists
      await organizationRepository.clear();
      
      await expect(service.delete(artifactId)).rejects.toHaveProperty(
        'message',
        'No organization exists in the system',
      );
    });
  });
});
