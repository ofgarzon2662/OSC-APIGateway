import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { faker } from '@faker-js/faker';
import { AppService } from '../app.service';

describe('ArtifactService', () => {
  let service: ArtifactService;
  let artifactRepository: Repository<ArtifactEntity>;
  let organizationRepository: Repository<OrganizationEntity>;
  let artifactList: ArtifactEntity[];
  let org: OrganizationEntity;
  let mockContract: any;
  let mockAppService: Partial<AppService>;

  beforeEach(async () => {
    mockContract = {
      submitTransaction: jest.fn(),
    };

    mockAppService = {
      getContract: jest.fn().mockReturnValue(mockContract),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [
        ArtifactService,
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
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
    await organizationRepository.clear();
    await artifactRepository.clear();
    artifactList = [];
    org = await organizationRepository.save({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
    });
    const artifactsAmount = 50;

    for (let i = 0; i < artifactsAmount; i++) {
      const randomBody = generateRandomBody();
      const artifact: ArtifactEntity = await artifactRepository.save({
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(200),
        body: randomBody,
        timeStamp: faker.date.past(),
        organization: org,
      });

      artifactList.push(artifact);
    }
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Find all artifacts
  it('findAll should return all artifacts', async () => {
    const artifacts: ArtifactEntity[] = await service.findAll(org.id);
    expect(artifacts).toBeDefined();
    expect(artifacts).not.toBeNull();
    expect(artifacts).toHaveLength(artifactList.length);
  });

  // Find all artifacts with an invalid organization
  it('findAll should throw an exception for an invalid organization', async () => {
    await expect(() =>
      service.findAll(faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Find one artifact
  it('findOne should return one artifact', async () => {
    const artifact: ArtifactEntity = await service.findOne(
      org.id,
      artifactList[0].id,
    );
    expect(artifact).toBeDefined();
    expect(artifact).not.toBeNull();
    expect(artifact.id).toEqual(artifactList[0].id);
  });

  // Get one artifact with an invalid id
  it('findOne should throw an error with an invalid id', async () => {
    await expect(service.findOne(org.id, 'invalid-id')).rejects.toHaveProperty(
      'message',
      'The artifactId provided is not valid',
    );
  });

  // Get non existent artifact
  it('findOne should throw an exception for a non existent artifact', async () => {
    const fakeUuid = faker.string.uuid();
    await expect(() =>
      service.findOne(org.id, fakeUuid),
    ).rejects.toHaveProperty(
      'message',
      'The artifact with the provided id does not exist',
    );
  });

  // Get one artifact with an invalid organization
  it('findOne should throw an exception for an invalid organization', async () => {
    await expect(() =>
      service.findOne(faker.string.uuid(), artifactList[0].id),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Create an artifact
  it('create should create an artifact when blockchain transaction succeeds', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };

    mockContract.submitTransaction.mockResolvedValueOnce(undefined);

    const createdArtifact: ArtifactEntity = await service.create(
      artifact,
      org.id,
    );

    expect(mockContract.submitTransaction).toHaveBeenCalledWith(
      'CreateArtifact',
      expect.any(String),
      artifact.name,
      artifact.description,
      JSON.stringify(artifact.body),
    );

    expect(createdArtifact).toBeDefined();
    expect(createdArtifact).not.toBeNull();
    expect(createdArtifact).toHaveProperty('id');
    expect(createdArtifact).toMatchObject(artifact);

    const artifacts: ArtifactEntity[] = await service.findAll(org.id);
    expect(artifacts).toHaveLength(artifactList.length + 1);
  });

  it('create should throw an exception when blockchain transaction fails', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };

    mockContract.submitTransaction.mockRejectedValueOnce(
      new Error('Blockchain transaction failed'),
    );

    await expect(service.create(artifact, org.id)).rejects.toHaveProperty(
      'message',
      'Failed to create artifact in blockchain: Blockchain transaction failed',
    );

    const artifacts: ArtifactEntity[] = await service.findAll(org.id);
    expect(artifacts).toHaveLength(artifactList.length);
  });

  // Create an artifact with an invalid organization
  it('create should throw an exception for an invalid organization', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    await expect(() =>
      service.create(artifact, faker.string.uuid()),
    ).rejects.toHaveProperty(
      'message',
      'The organization provided does not exist',
    );
  });

  // Create an artifact with an invalid body
  it('create should throw an exception for an invalid body', async () => {
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: 'invalid-json',
    };
    await expect(() => service.create(artifact, org.id)).rejects.toHaveProperty(
      'message',
      'The body of the artifact should be a valid JSON object',
    );
  });

  // Create an artifact with an invalid description
  it('create should throw an exception for an invalid description', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: 'short-description',
      body: randomBody,
    };
    await expect(() => service.create(artifact, org.id)).rejects.toHaveProperty(
      'message',
      'The description of the artifact is required and should be at least 200 characters long',
    );
  });

  // Create an artifact with a name that already exists
  it('create should throw an exception for an already existing name', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: artifactList[0].name,
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    await expect(() => service.create(artifact, org.id)).rejects.toHaveProperty(
      'message',
      'The artifact name provided is already in use within this organization',
    );
  });

  // Update an artifact with valid data
  it('update should successfully update an artifact with valid data', async () => {
    const artifactId = artifactList[0].id;
    const updateData: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: generateRandomBody(),
    };
    const updatedArtifact = await service.update(artifactId, updateData);
    expect(updatedArtifact).toBeDefined();
    expect(updatedArtifact).toMatchObject(updateData);
    expect(updatedArtifact.id).toEqual(artifactId);
  });

  // Update an artifact with an invalid ID
  it('update should throw an error with an invalid ID', async () => {
    const invalidId = 'invalid-id';
    const updateData: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: generateRandomBody(),
    };
    await expect(service.update(invalidId, updateData)).rejects.toHaveProperty(
      'message',
      'The artifactId provided is not valid',
    );
  });

  // Update a non-existent artifact
  it('update should throw an exception for a non-existent artifact', async () => {
    const nonExistentId = faker.string.uuid();
    const updateData: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: generateRandomBody(),
    };
    await expect(
      service.update(nonExistentId, updateData),
    ).rejects.toHaveProperty(
      'message',
      'The artifact with the provided id does not exist',
    );
  });

  // Update an artifact with an existing name
  it('update should throw an exception for an already existing name', async () => {
    const artifactId = artifactList[0].id;
    const updateData: Partial<ArtifactEntity> = {
      name: artifactList[1].name,
      description: faker.lorem.sentence(200),
      body: generateRandomBody(),
    };
    await expect(service.update(artifactId, updateData)).rejects.toHaveProperty(
      'message',
      'The artifact name provided is already in use within this organization',
    );
  });

  // Create an artifact with an invalid Org ID
  it('create should throw an exception for an invalid organization', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    await expect(() =>
      service.create(artifact, 'invalid-id'),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  // Update an artifact with a description shorter than 200 characters
  it('update should throw an error if description is less than 200 characters', async () => {
    const artifactId = artifactList[0].id; // Use an existing artifact's ID
    const updateData: Partial<ArtifactEntity> = {
      description: 'Too short', // Description less than 200 characters
    };

    await expect(service.update(artifactId, updateData)).rejects.toHaveProperty(
      'message',
      'The description must be at least 200 characters long',
    );
  });

  // Delete an artifact with a valid ID
  it('delete should successfully delete an existing artifact', async () => {
    const artifactId = artifactList[0].id;

    await service.delete(artifactId);

    // Check if the artifact has been removed
    const deletedArtifact = await artifactRepository.findOne({
      where: { id: artifactId },
    });
    expect(deletedArtifact).toBeNull();
  });

  // Delete an artifact with an invalid ID
  it('delete should throw an error with an invalid artifact id', async () => {
    const invalidId = 'invalid-id';

    await expect(service.delete(invalidId)).rejects.toHaveProperty(
      'message',
      'The artifactId provided is not valid',
    );
  });

  // Delete a non-existent artifact
  it('delete should throw an exception for a non-existent artifact id', async () => {
    const nonExistentId = faker.string.uuid();

    await expect(service.delete(nonExistentId)).rejects.toHaveProperty(
      'message',
      'The artifact with the provided id does not exist',
    );
  });

  // Helper function to generate a random body for an artifact
  const generateRandomBody = () => {
    return JSON.stringify({
      title: faker.lorem.words(5),
      content: faker.lorem.sentences(5),
      metadata: {
        author: faker.person.fullName(),
        createdAt: faker.date.past().toISOString(),
        tags: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
      },
    });
  };
});
