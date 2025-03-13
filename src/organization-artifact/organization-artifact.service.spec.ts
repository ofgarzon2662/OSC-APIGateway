import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationArtifactService } from './organization-artifact.service';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddArtifactToOrganizationDto } from './dto/add-artifact-to-organization.dto';
import { UpdateArtifactInOrganizationDto } from './dto/update-artifact-in-organization.dto';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { faker } from '@faker-js/faker';

describe('OrganizationArtifactService', () => {
  let service: OrganizationArtifactService;
  let organizationRepository: Repository<OrganizationEntity>;
  let artifactRepository: Repository<ArtifactEntity>;
  let organization: OrganizationEntity;
  let artifacts: ArtifactEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [OrganizationArtifactService],
    }).compile();

    service = module.get<OrganizationArtifactService>(
      OrganizationArtifactService,
    );
    organizationRepository = module.get<Repository<OrganizationEntity>>(
      getRepositoryToken(OrganizationEntity),
    );
    artifactRepository = module.get<Repository<ArtifactEntity>>(
      getRepositoryToken(ArtifactEntity),
    );
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await organizationRepository.clear();
    await artifactRepository.clear();

    // Create organization
    organization = await organizationRepository.save({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
    });

    // Create artifacts
    artifacts = [];
    for (let i = 0; i < 5; i++) {
      const artifact = await artifactRepository.save({
        title: faker.commerce.productName(),
        contributor: faker.person.fullName(),
        description: faker.lorem.paragraphs(3), // Ensure it's long enough (>200 chars)
        body: { content: faker.lorem.paragraph() },
        submittedAt: new Date(),
        keywords: [faker.word.sample(), faker.word.sample()],
        links: [faker.internet.url()],
        organization: organization,
      });
      artifacts.push(artifact);
    }
  };
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findArtifactsByOrganization', () => {
    it('should return all artifacts for an organization', async () => {
      const result = await service.findArtifactsByOrganization(organization.id);
      expect(result).toBeDefined();
      expect(result.length).toBe(artifacts.length);
    });

    it('should throw an exception if organization is not found', async () => {
      const invalidId = faker.string.uuid();
      await expect(
        service.findArtifactsByOrganization(invalidId),
      ).rejects.toHaveProperty(
        'message',
        'The organization with the given id was not found',
      );
    });

    it('should throw an exception if organizationId is invalid', async () => {
      await expect(
        service.findArtifactsByOrganization('invalid-id'),
      ).rejects.toHaveProperty('message', 'The organizationId is not valid');
    });
  });

  describe('findOneArtifactByOrganization', () => {
    it('should return an artifact by id for an organization', async () => {
      const artifact = artifacts[0];
      const result = await service.findOneArtifactByOrganization(
        organization.id,
        artifact.id,
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(artifact.id);
    });

    it('should throw an exception if organization is not found', async () => {
      const invalidOrgId = faker.string.uuid();
      const artifact = artifacts[0];
      await expect(
        service.findOneArtifactByOrganization(invalidOrgId, artifact.id),
      ).rejects.toHaveProperty(
        'message',
        'The organization with the given id was not found',
      );
    });

    it('should throw an exception if artifact is not found', async () => {
      const invalidArtifactId = faker.string.uuid();
      await expect(
        service.findOneArtifactByOrganization(
          organization.id,
          invalidArtifactId,
        ),
      ).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found in the organization',
      );
    });

    it('should throw an exception if organizationId is invalid', async () => {
      const artifact = artifacts[0];
      await expect(
        service.findOneArtifactByOrganization('invalid-id', artifact.id),
      ).rejects.toHaveProperty('message', 'The organizationId is not valid');
    });

    it('should throw an exception if artifactId is invalid', async () => {
      await expect(
        service.findOneArtifactByOrganization(organization.id, 'invalid-id'),
      ).rejects.toHaveProperty('message', 'The artifactId is not valid');
    });
  });

  describe('addArtifactToOrganization', () => {
    it('should add an artifact to an organization', async () => {
      // Create a new artifact not associated with any organization
      const newArtifact = await artifactRepository.save({
        title: faker.commerce.productName(),
        contributor: faker.person.fullName(),
        description: faker.lorem.paragraphs(3),
        body: { content: faker.lorem.paragraph() },
        submittedAt: new Date(),
        keywords: [faker.word.sample(), faker.word.sample()],
        links: [faker.internet.url()],
      });

      const dto: AddArtifactToOrganizationDto = {
        organizationId: organization.id,
        artifactId: newArtifact.id,
        description: faker.lorem.paragraphs(3),
      };

      const result = await service.addArtifactToOrganization(dto);
      expect(result).toBeDefined();
      expect(result.organizationId).toBe(organization.id);
      expect(result.artifactId).toBe(newArtifact.id);

      // Verify the artifact is now associated with the organization
      const updatedArtifact = await artifactRepository.findOne({
        where: { id: newArtifact.id },
        relations: ['organization'],
      });
      expect(updatedArtifact.organization).toBeDefined();
      expect(updatedArtifact.organization.id).toBe(organization.id);
    });

    it('should throw an exception if organization is not found', async () => {
      const artifact = artifacts[0];
      const invalidOrgId = faker.string.uuid();
      const dto: AddArtifactToOrganizationDto = {
        organizationId: invalidOrgId,
        artifactId: artifact.id,
      };

      await expect(
        service.addArtifactToOrganization(dto),
      ).rejects.toHaveProperty(
        'message',
        'The organization with the given id was not found',
      );
    });

    it('should throw an exception if artifact is not found', async () => {
      const invalidArtifactId = faker.string.uuid();
      const dto: AddArtifactToOrganizationDto = {
        organizationId: organization.id,
        artifactId: invalidArtifactId,
      };

      await expect(
        service.addArtifactToOrganization(dto),
      ).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found',
      );
    });

    it('should throw an exception if organizationId is invalid', async () => {
      const artifact = artifacts[0];
      const dto: AddArtifactToOrganizationDto = {
        organizationId: 'invalid-id',
        artifactId: artifact.id,
      };

      await expect(
        service.addArtifactToOrganization(dto),
      ).rejects.toHaveProperty('message', 'The organizationId is not valid');
    });

    it('should throw an exception if artifactId is invalid', async () => {
      const dto: AddArtifactToOrganizationDto = {
        organizationId: organization.id,
        artifactId: 'invalid-id',
      };

      await expect(
        service.addArtifactToOrganization(dto),
      ).rejects.toHaveProperty('message', 'The artifactId is not valid');
    });
  });

  describe('updateArtifactInOrganization', () => {
    it('should update an artifact in an organization', async () => {
      const artifact = artifacts[0];
      const newName = faker.commerce.productName();
      const newDescription = faker.lorem.paragraphs(3);

      const dto: UpdateArtifactInOrganizationDto = {
        name: newName,
        description: newDescription,
      };

      const result = await service.updateArtifactInOrganization(
        organization.id,
        artifact.id,
        dto,
      );
      expect(result).toBeDefined();
      expect(result.artifactName).toBe(newName);
      expect(result.description).toBe(newDescription);

      // Verify the artifact was updated in the database
      const updatedArtifact = await artifactRepository.findOne({
        where: { id: artifact.id },
      });
      expect(updatedArtifact.title).toBe(newName);
      expect(updatedArtifact.description).toBe(newDescription);
    });

    it('should throw an exception if organization is not found', async () => {
      const artifact = artifacts[0];
      const invalidOrgId = faker.string.uuid();
      const dto: UpdateArtifactInOrganizationDto = {
        description: faker.lorem.paragraphs(3),
      };

      await expect(
        service.updateArtifactInOrganization(invalidOrgId, artifact.id, dto),
      ).rejects.toHaveProperty(
        'message',
        'The organization with the given id was not found',
      );
    });

    it('should throw an exception if artifact is not found', async () => {
      const invalidArtifactId = faker.string.uuid();
      const dto: UpdateArtifactInOrganizationDto = {
        description: faker.lorem.paragraphs(3),
      };

      await expect(
        service.updateArtifactInOrganization(
          organization.id,
          invalidArtifactId,
          dto,
        ),
      ).rejects.toHaveProperty(
        'message',
        'The artifact with the given id was not found in the organization',
      );
    });

    it('should throw an exception for a description that is too short', async () => {
      const artifact = artifacts[0];
      const dto: UpdateArtifactInOrganizationDto = {
        description: 'Too short', // Less than 200 characters
      };

      await expect(
        service.updateArtifactInOrganization(organization.id, artifact.id, dto),
      ).rejects.toHaveProperty(
        'message',
        'The description must be at least 200 characters long',
      );
    });

    it('should throw an exception if name is already in use', async () => {
      const artifact1 = artifacts[0];
      const artifact2 = artifacts[1];
      const dto: UpdateArtifactInOrganizationDto = {
        name: artifact2.title, // Use the name of another artifact
      };

      await expect(
        service.updateArtifactInOrganization(organization.id, artifact1.id, dto),
      ).rejects.toHaveProperty(
        'message',
        'The artifact name is already in use within this organization',
      );
    });

    it('should throw an exception if organizationId is invalid', async () => {
      const artifact = artifacts[0];
      const dto: UpdateArtifactInOrganizationDto = {
        description: faker.lorem.paragraphs(3),
      };

      await expect(
        service.updateArtifactInOrganization('invalid-id', artifact.id, dto),
      ).rejects.toHaveProperty('message', 'The organizationId is not valid');
    });

    it('should throw an exception if artifactId is invalid', async () => {
      const dto: UpdateArtifactInOrganizationDto = {
        description: faker.lorem.paragraphs(3),
      };

      await expect(
        service.updateArtifactInOrganization(organization.id, 'invalid-id', dto),
      ).rejects.toHaveProperty('message', 'The artifactId is not valid');
    });
  });

  describe('removeArtifactFromOrganization', () => {
    it('should remove an artifact from an organization', async () => {
      const artifact = artifacts[0];
      await service.removeArtifactFromOrganization(artifact.id, organization.id);

      // Verify the artifact is no longer associated with the organization
      const updatedArtifact = await artifactRepository.findOne({
        where: { id: artifact.id },
        relations: ['organization'],
      });
      expect(updatedArtifact.organization).toBeNull();
    });

    it('should throw an exception if artifact is not found', async () => {
      const invalidArtifactId = faker.string.uuid();
      await expect(
        service.removeArtifactFromOrganization(
          invalidArtifactId,
          organization.id,
        ),
      ).rejects.toHaveProperty(
        'message',
        'The artifact is not associated with the given organization',
      );
    });

    it('should throw an exception if artifact is not associated with organization', async () => {
      // Create a new artifact not associated with any organization
      const newArtifact = await artifactRepository.save({
        title: faker.commerce.productName(),
        contributor: faker.person.fullName(),
        description: faker.lorem.paragraphs(3),
        body: { content: faker.lorem.paragraph() },
        submittedAt: new Date(),
        keywords: [faker.word.sample(), faker.word.sample()],
        links: [faker.internet.url()],
      });

      await expect(
        service.removeArtifactFromOrganization(
          newArtifact.id,
          organization.id,
        ),
      ).rejects.toHaveProperty(
        'message',
        'The artifact is not associated with the given organization',
      );
    });

    it('should throw an exception if organizationId is invalid', async () => {
      const artifact = artifacts[0];
      await expect(
        service.removeArtifactFromOrganization(artifact.id, 'invalid-id'),
      ).rejects.toHaveProperty('message', 'The organizationId is not valid');
    });

    it('should throw an exception if artifactId is invalid', async () => {
      await expect(
        service.removeArtifactFromOrganization('invalid-id', organization.id),
      ).rejects.toHaveProperty('message', 'The artifactId is not valid');
    });
  });
});
