import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { faker } from '@faker-js/faker';

describe('ArtifactService', () => {
  let service: ArtifactService;
  let artifactRepository: Repository<ArtifactEntity>;
  let organizationRepository: Repository<OrganizationEntity>;
  let artifactList: ArtifactEntity[];
  let org: OrganizationEntity;

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
        // The Body needs to be a string parsable to JSON
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
    const artifacts: ArtifactEntity[] = await service.findAll();
    expect(artifacts).toBeDefined();
    expect(artifacts).not.toBeNull();
    expect(artifacts).toHaveLength(artifactList.length);
  });
  // Find one artifact
  it('findOne should return one artifact', async () => {
    const artifact: ArtifactEntity = await service.findOne(artifactList[0].id);
    expect(artifact).toBeDefined();
    expect(artifact).not.toBeNull();
    expect(artifact.id).toEqual(artifactList[0].id);
  });
  // Get one artifact with an invalid id
  it('findOne should throw an error with an invalid id', async () => {
    await expect(service.findOne('invalid-id')).rejects.toHaveProperty(
      'message',
      'The artifact Id provided is not valid',
    );
  });
  // Get non existent artifact
  it('findOne should throw an exception for a non existent artifact', async () => {
    const fakeUuid = faker.string.uuid();
    await expect(() => service.findOne(fakeUuid)).rejects.toHaveProperty(
      'message',
      'The artifact with the provided id does not exist',
    );
  });
  // Create an artifact
  it('create should create an artifact', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    const createdArtifact: ArtifactEntity = await service.create(
      artifact,
      org.id,
    );
    expect(createdArtifact).toBeDefined();
    expect(createdArtifact).not.toBeNull();
    expect(createdArtifact).toHaveProperty('id');
    expect(createdArtifact).toMatchObject(artifact);
    // List of artifacts should have one more element
    const artifacts: ArtifactEntity[] = await service.findAll();
    expect(artifacts).toHaveLength(artifactList.length + 1);
  });

  // Create an artifact with an invalid organization
  it('create should throw an exception for an invalid organization', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    const fakeUuid = faker.string.uuid();
    await expect(() =>
      service.create(artifact, fakeUuid),
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
      'The artifact name provided is already in use',
    );
  });

  // create an artifact with an invalid organizationid
  it('create should throw an exception for an invalid organizationId', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    await expect(() =>
      service.create(artifact, 'invalid-organization-id'),
    ).rejects.toHaveProperty(
      'message',
      'The organizationId provided is not valid',
    );
  });

  // create an artifact with an empty name
  it('create should throw an exception for an empty name', async () => {
    const randomBody = generateRandomBody();
    const artifact: Partial<ArtifactEntity> = {
      name: '',
      description: faker.lorem.sentence(200),
      body: randomBody,
    };
    await expect(() => service.create(artifact, org.id)).rejects.toHaveProperty(
      'message',
      'The name of the artifact is required',
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

  // Update an artifact with only name
  it('update should allow updating only the name of an artifact', async () => {
    const artifactId = artifactList[1].id;
    const newName = faker.commerce.productName();
    const updatedArtifact = await service.update(artifactId, { name: newName });
    expect(updatedArtifact).toBeDefined();
    expect(updatedArtifact.name).toEqual(newName);
    expect(updatedArtifact.id).toEqual(artifactId);
  });

  // Update an artifact with only body
  it('update should allow updating only the body of an artifact', async () => {
    const artifactId = artifactList[2].id;
    const newBody = generateRandomBody();
    const updatedArtifact = await service.update(artifactId, { body: newBody });
    expect(updatedArtifact).toBeDefined();
    expect(updatedArtifact.body).toEqual(newBody);
    expect(updatedArtifact.id).toEqual(artifactId);
  });

  // Attempt to update an artifact with an invalid UUID
  it('update should throw an error with an invalid artifact id', async () => {
    const invalidId = 'invalid-id';
    const updateData: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
    };
    await expect(service.update(invalidId, updateData)).rejects.toHaveProperty(
      'message',
      'The artifact Id provided is not valid',
    );
  });

  // Attempt to update a non-existent artifact
  it('update should throw an exception for a non-existent artifact id', async () => {
    const nonExistentId = faker.string.uuid();
    const updateData: Partial<ArtifactEntity> = {
      name: faker.commerce.productName(),
    };
    await expect(
      service.update(nonExistentId, updateData),
    ).rejects.toHaveProperty(
      'message',
      'The artifact with the provided id does not exist',
    );
  });

  // Attempt to update an artifact with a description too short
  it('update should throw an error if the new description is too short', async () => {
    const artifactId = artifactList[3].id;
    const shortDescription = 'short';
    const updateData: Partial<ArtifactEntity> = {
      description: shortDescription,
    };
    await expect(service.update(artifactId, updateData)).rejects.toHaveProperty(
      'message',
      'The new description of the artifact should be at least 200 characters long',
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
      'The artifact Id provided is not valid',
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

  // create a function that generates a random body for an artifact
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
