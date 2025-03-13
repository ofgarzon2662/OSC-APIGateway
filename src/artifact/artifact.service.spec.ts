import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { faker } from '@faker-js/faker';

describe('ArtifactService', () => {
  let service: ArtifactService;
  let artifactRepository: Repository<ArtifactEntity>;
  let artifactList: ArtifactEntity[];

  // Helper function to generate a random JSON object for the body
  const generateRandomBody = () => {
    return {
      content: faker.lorem.paragraphs(3),
      metadata: {
        author: faker.person.fullName(),
        createdAt: faker.date.past().toISOString(),
        tags: [faker.word.sample(), faker.word.sample(), faker.word.sample()],
      },
      sections: [
        {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(2),
        },
        {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(2),
        },
      ],
    };
  };

  // Helper function to generate a valid artifact
  const generateValidArtifact = (): Partial<ArtifactEntity> => {
    return {
      title: faker.commerce.productName().replace(/[^a-zA-Z0-9-]/g, '-'),
      contributor: faker.person.fullName(),
      description: faker.lorem.paragraphs(5), // Ensure it's long enough
      body: generateRandomBody(),
      keywords: [faker.word.sample(), faker.word.sample(), faker.word.sample()],
      links: [faker.internet.url(), faker.internet.url()],
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
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await artifactRepository.clear();
    artifactList = [];
    
    // Create 5 artifacts for testing
    for (let i = 0; i < 5; i++) {
      const artifact = generateValidArtifact();
      const savedArtifact = await artifactRepository.save({
        ...artifact,
        submittedAt: new Date(),
      });
      artifactList.push(savedArtifact);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // FIND ALL TESTS
  describe('findAll', () => {
    it('should return all artifacts', async () => {
      const artifacts = await service.findAll();
      expect(artifacts).toBeDefined();
      expect(artifacts).not.toBeNull();
      expect(artifacts).toHaveLength(artifactList.length);
    });
  });

  // FIND ONE TESTS
  describe('findOne', () => {
    it('should return one artifact by id', async () => {
      const storedArtifact = artifactList[0];
      const artifact = await service.findOne(storedArtifact.id);
      expect(artifact).toBeDefined();
      expect(artifact.id).toEqual(storedArtifact.id);
    });

    it('should throw an exception for an invalid UUID', async () => {
      await expect(() => service.findOne('invalid-id')).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid'
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      await expect(() => service.findOne(faker.string.uuid())).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist'
      );
    });
  });

  // CREATE TESTS
  describe('create', () => {
    it('should create a new artifact with valid data', async () => {
      const newArtifact = generateValidArtifact();
      const result = await service.create(newArtifact);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toEqual(newArtifact.title);
      expect(result.description).toEqual(newArtifact.description);
      expect(result.submittedAt).toBeDefined();
      
      // Verify it was added to the database
      const storedArtifact = await artifactRepository.findOne({ where: { id: result.id } });
      expect(storedArtifact).toBeDefined();
    });

    it('should throw an exception for a title that is too short', async () => {
      const invalidArtifact = generateValidArtifact();
      invalidArtifact.title = 'ab'; // Less than 3 characters
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The title of the artifact is required, must be at least 3 characters long, and can only contain alphanumeric characters and hyphens'
      );
    });

    it('should throw an exception for a title with invalid characters', async () => {
      const invalidArtifact = generateValidArtifact();
      invalidArtifact.title = 'Invalid Title!'; // Contains spaces and special characters
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The title of the artifact is required, must be at least 3 characters long, and can only contain alphanumeric characters and hyphens'
      );
    });

    it('should throw an exception for a description that is too short', async () => {
      const invalidArtifact = generateValidArtifact();
      invalidArtifact.description = 'Short description'; // Less than 200 characters
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The description of the artifact is required and should be at least 200 characters long'
      );
    });

    it('should throw an exception for an invalid body (string)', async () => {
      const invalidArtifact = generateValidArtifact();
      invalidArtifact.body = 'This is not a JSON object';
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The body of the artifact should be a valid JSON object'
      );
    });

    it('should throw an exception for missing body', async () => {
      const invalidArtifact = generateValidArtifact();
      delete invalidArtifact.body;
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The body of the artifact is required and should be a valid JSON object'
      );
    });

    it('should throw an exception for keywords exceeding total length', async () => {
      const invalidArtifact = generateValidArtifact();
      // Create very long keywords that exceed 200 characters in total
      invalidArtifact.keywords = [
        faker.string.sample(100),
        faker.string.sample(101),
      ];
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The keywords array can have at most 200 characters in total'
      );
    });

    it('should throw an exception for links exceeding total length', async () => {
      const invalidArtifact = generateValidArtifact();
      // Create very long links that exceed 1000 characters in total
      invalidArtifact.links = [
        'https://example.com/' + faker.string.sample(500),
        'https://example.com/' + faker.string.sample(501),
      ];
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'The links array can have at most 1000 characters in total'
      );
    });

    it('should throw an exception for invalid URLs in links', async () => {
      const invalidArtifact = generateValidArtifact();
      invalidArtifact.links = ['not-a-valid-url', 'also-not-valid'];
      
      await expect(() => service.create(invalidArtifact)).rejects.toHaveProperty(
        'message',
        'Each link in the links array must be a valid URL'
      );
    });

    it('should parse a JSON string body correctly', async () => {
      const newArtifact = generateValidArtifact();
      const bodyObject = newArtifact.body;
      newArtifact.body = JSON.stringify(bodyObject);
      
      const result = await service.create(newArtifact);
      expect(result).toBeDefined();
      expect(typeof result.body).toBe('object');
      expect(result.body).toEqual(bodyObject);
    });
  });

  // UPDATE TESTS
  describe('update', () => {
    it('should update only the description of an artifact', async () => {
      const artifactToUpdate = artifactList[0];
      const newDescription = faker.lorem.paragraphs(5); // Ensure it's long enough
      
      const result = await service.update(artifactToUpdate.id, {
        description: newDescription,
      });
      
      expect(result).toBeDefined();
      expect(result.description).toEqual(newDescription);
      expect(result.title).toEqual(artifactToUpdate.title); // Should remain unchanged
    });

    it('should update only the body of an artifact', async () => {
      const artifactToUpdate = artifactList[0];
      const newBody = generateRandomBody();
      
      const result = await service.update(artifactToUpdate.id, {
        body: newBody,
      });
      
      expect(result).toBeDefined();
      expect(result.body).toEqual(newBody);
    });

    it('should update only the keywords of an artifact', async () => {
      const artifactToUpdate = artifactList[0];
      const newKeywords = ['new', 'keywords', 'list'];
      
      const result = await service.update(artifactToUpdate.id, {
        keywords: newKeywords,
      });
      
      expect(result).toBeDefined();
      expect(result.keywords).toEqual(newKeywords);
    });

    it('should update only the links of an artifact', async () => {
      const artifactToUpdate = artifactList[0];
      const newLinks = [faker.internet.url(), faker.internet.url()];
      
      const result = await service.update(artifactToUpdate.id, {
        links: newLinks,
      });
      
      expect(result).toBeDefined();
      expect(result.links).toEqual(newLinks);
    });

    it('should update multiple allowed fields at once', async () => {
      const artifactToUpdate = artifactList[0];
      const updateData = {
        description: faker.lorem.paragraphs(5),
        body: generateRandomBody(),
        keywords: ['updated', 'keywords'],
        links: [faker.internet.url()],
      };
      
      const result = await service.update(artifactToUpdate.id, updateData);
      
      expect(result).toBeDefined();
      expect(result.description).toEqual(updateData.description);
      expect(result.body).toEqual(updateData.body);
      expect(result.keywords).toEqual(updateData.keywords);
      expect(result.links).toEqual(updateData.links);
    });

    it('should throw an exception when trying to update title', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        title: 'new-title',
      })).rejects.toHaveProperty(
        'message',
        'Only description, body, keywords, and links can be updated'
      );
    });

    it('should throw an exception when trying to update contributor', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        contributor: 'New Contributor',
      })).rejects.toHaveProperty(
        'message',
        'Only description, body, keywords, and links can be updated'
      );
    });

    it('should throw an exception when trying to update submittedAt', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        submittedAt: new Date(),
      })).rejects.toHaveProperty(
        'message',
        'Only description, body, keywords, and links can be updated'
      );
    });

    it('should throw an exception for a description that is too short', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        description: 'Too short',
      })).rejects.toHaveProperty(
        'message',
        'The description must be at least 200 characters long'
      );
    });

    it('should throw an exception for an invalid body', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        body: 123, // Not an object or valid JSON string
      })).rejects.toHaveProperty(
        'message',
        'The body of the artifact should be a valid JSON object'
      );
    });

    it('should throw an exception for keywords exceeding total length', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        keywords: [faker.string.sample(201)], // Exceeds 200 characters
      })).rejects.toHaveProperty(
        'message',
        'The keywords array can have at most 200 characters in total'
      );
    });

    it('should throw an exception for links exceeding total length', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        links: [faker.string.sample(1001)], // Exceeds 1000 characters
      })).rejects.toHaveProperty(
        'message',
        'The links array can have at most 1000 characters in total'
      );
    });

    it('should throw an exception for invalid URLs in links', async () => {
      const artifactToUpdate = artifactList[0];
      
      await expect(() => service.update(artifactToUpdate.id, {
        links: ['not-a-valid-url'],
      })).rejects.toHaveProperty(
        'message',
        'Each link in the links array must be a valid URL'
      );
    });

    it('should throw an exception for a non-existent artifact', async () => {
      await expect(() => service.update(faker.string.uuid(), {
        description: faker.lorem.paragraphs(5),
      })).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist'
      );
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      await expect(() => service.update('invalid-id', {
        description: faker.lorem.paragraphs(5),
      })).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid'
      );
    });
  });

  // DELETE TESTS
  describe('delete', () => {
    it('should delete an existing artifact', async () => {
      const artifact = artifactList[0];
      
      await service.delete(artifact.id);
      
      // Verify it was deleted
      const deletedArtifact = await artifactRepository.findOne({ where: { id: artifact.id } });
      expect(deletedArtifact).toBeNull();
    });

    it('should throw an exception for a non-existent artifact', async () => {
      await expect(() => service.delete(faker.string.uuid())).rejects.toHaveProperty(
        'message',
        'The artifact with the provided id does not exist'
      );
    });

    it('should throw an exception for an invalid artifact ID', async () => {
      await expect(() => service.delete('invalid-id')).rejects.toHaveProperty(
        'message',
        'The artifactId provided is not valid'
      );
    });
  });
});
