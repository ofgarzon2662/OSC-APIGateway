import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { UserCreateDto } from './userCreate.dto';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import { UserGetDto } from './userGet.dto';
import { plainToClass } from 'class-transformer';
import { User } from './user';
import { Role } from '../shared/enums/role.enums';
import { OrganizationEntity } from '../organization/organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { validate } from 'class-validator';
import { AdminOrganizationDto } from './dto/admin-organization.dto';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
  ) {}

  async onModuleInit() {
    await this.loadUsersFromEnv();
  }

  async loadUsersFromEnv() {
    // Load Admin User 1
    const admin1Username = this.configService.get<string>('ADMIN1_USERNAME');
    const admin1Password = this.configService.get<string>('ADMIN1_PASSWORD');
    const admin1RolesStr = this.configService.get<string>(
      'ADMIN1_ROLES',
      'admin',
    );
    const admin1Roles = admin1RolesStr ? admin1RolesStr.split(',') : ['admin'];

    if (admin1Username && admin1Password) {
      this.users.push(new User(1, admin1Username, admin1Password, admin1Roles));

      // Save admin1 to database if it doesn't exist
      await this.saveAdminUserToDb(admin1Username, admin1Password, admin1Roles);
    }

    // Load Admin User 2
    const admin2Username = this.configService.get<string>('ADMIN2_USERNAME');
    const admin2Password = this.configService.get<string>('ADMIN2_PASSWORD');
    const admin2RolesStr = this.configService.get<string>(
      'ADMIN2_ROLES',
      'admin',
    );
    const admin2Roles = admin2RolesStr ? admin2RolesStr.split(',') : ['admin'];

    if (admin2Username && admin2Password) {
      this.users.push(new User(2, admin2Username, admin2Password, admin2Roles));

      // Save admin2 to database if it doesn't exist
      await this.saveAdminUserToDb(admin2Username, admin2Password, admin2Roles);
    }

    // Check if any users were loaded
    if (this.users.length === 0) {
      const errorMessage = `
No users found in environment variables. Please create a .env file with the following variables:

# Admin User 1
ADMIN1_USERNAME=your_admin1_username
ADMIN1_PASSWORD=your_admin1_password
ADMIN1_ROLES=admin

# Admin User 2
ADMIN2_USERNAME=your_admin2_username
ADMIN2_PASSWORD=your_admin2_password
ADMIN2_ROLES=admin

The application requires at least one admin user to function properly.
`;
      throw new Error(errorMessage);
    }
  }

  private async saveAdminUserToDb(
    username: string,
    password: string,
    roles: string[],
  ): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { username: username },
          { email: username + '@admin.com' }, // Generate a default email
        ],
      });

      if (!existingUser) {
        // Hash the password
        const hashedPassword =
          await this.passwordService.hashPassword(password);

        // Create the user entity
        const userEntity = this.userRepository.create({
          name: username,
          username: username,
          email: username + '@admin.com', // Generate a default email
          password: hashedPassword,
          roles: roles, // Save the roles to the database
        });

        // Save the user to the database
        await this.userRepository.save(userEntity);
      } else {
        console.log(`Admin user ${username} already exists in database`);
      }
    } catch (error) {
      console.error(`Error saving admin user ${username} to database:`, error);
    }
  }

  private async validateOrganizationId(organizationId: string): Promise<OrganizationEntity> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new BadRequestException('Invalid organization ID format. Must be a valid UUID.');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });

    if (!organization) {
      throw new BusinessLogicException(
        'Organization not found',
        BusinessError.NOT_FOUND
      );
    }

    return organization;
  }

  /**
   * Find a user by username or email
   * @param username The username or email to search for
   * @param organizationId Optional organization ID for organization-specific queries
   * @returns The user data
   */
  async findOne(username: string, organizationId?: string): Promise<any> {
    const foundUser = await this.userRepository.findOne({
      where: [
        { username: username },
        { email: username }
      ],
      relations: ['organization']
    });
    
    if (!foundUser) {
      throw new BusinessLogicException(
        'User not found',
        BusinessError.NOT_FOUND,
      );
    }

    // If organizationId is provided, validate it and check if the user belongs to that organization
    if (organizationId) {
      await this.validateOrganizationId(organizationId);
      if (foundUser.organization?.id !== organizationId) {
        throw new BusinessLogicException(
          'User does not belong to the specified organization',
          BusinessError.PRECONDITION_FAILED,
        );
      }
    }

    // Convert the entity to a User object with all necessary fields
    return {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      email: foundUser.email,
      password: foundUser.password, // Include password for authentication
      roles: foundUser.roles || [], // Include roles for authorization
    };
  }

  // Get One User by username: Gives a GiveUserDto
  async getOne(username: string, organizationId: string): Promise<UserGetDto> {
    const user = await this.userRepository.findOne({
      // username or email
      where: [{ username: username }, { email: username }],
      relations: ['organization'],
    });

    if (!user) {
      throw new BusinessLogicException(
        'User not found',
        BusinessError.NOT_FOUND,
      );
    }

    // Validate organization and check if the user belongs to that organization
    await this.validateOrganizationId(organizationId);
    if (user.organization?.id !== organizationId) {
      throw new BusinessLogicException(
        'User does not belong to the specified organization',
        BusinessError.PRECONDITION_FAILED,
      );
    }

    return plainToClass(UserGetDto, user, { excludeExtraneousValues: true });
  }

  /**
   * Associates an admin user with an organization
   * @param userId The ID of the admin user
   * @param organizationId The ID of the organization to associate with
   * @returns The admin user data with organization information
   */
  async associateAdminWithOrganization(userId: string, organizationId: string): Promise<AdminOrganizationDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user is an admin
    if (!user.roles.includes(Role.ADMIN)) {
      throw new BadRequestException('Only admin users can be associated with organizations');
    }

    // Verify user isn't already associated with an organization
    if (user.organization) {
      throw new BadRequestException('User is already associated with an organization');
    }

    // Validate and get the organization
    const organization = await this.validateOrganizationId(organizationId);

    // Associate user with organization
    user.organization = organization;
    const savedUser = await this.userRepository.save(user);

    // Transform to DTO to exclude sensitive information
    return plainToClass(AdminOrganizationDto, savedUser, { 
      excludeExtraneousValues: true 
    });
  }

  // Create a new user with organization association
  async create(createUserDto: CreateUserDto, organizationId: string, creator?: UserEntity): Promise<UserEntity> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('User with this username or email already exists');
    }

    // Validate password length
    if (createUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Validate roles
    if (!createUserDto.roles || createUserDto.roles.length === 0) {
      throw new BadRequestException('User must have at least one role');
    }

    // If creator is provided, validate their permissions
    if (creator) {
      // Role-based permission checks
      if (creator.roles.includes(Role.PI)) {
        // PI can only create PI or COLLABORATOR users
        const invalidRoles = createUserDto.roles.filter(role => 
          role !== Role.PI && role !== Role.COLLABORATOR
        );
        
        if (invalidRoles.length > 0) {
          throw new BadRequestException('PI can only create PI or COLLABORATOR users');
        }
        
        // PI must be associated with an organization to create users
        if (!creator.organization) {
          throw new BadRequestException('PI must be associated with an organization to create users');
        }
        
        // PI can only create users in their organization
        if (creator.organization.id !== organizationId) {
          throw new BadRequestException('PI can only create users for their associated organization');
        }
      } else if (creator.roles.includes(Role.ADMIN)) {
        // Admin creating non-admin users must be associated with an organization
        const isCreatingNonAdmin = createUserDto.roles.some(role => 
          role !== Role.ADMIN
        );
        
        if (isCreatingNonAdmin && !creator.organization) {
          throw new BadRequestException('Admin must be associated with an organization to create PI or Collaborator users');
        }
        
        // If admin is creating non-admin users, they must be in the same organization
        if (isCreatingNonAdmin && creator.organization && creator.organization.id !== organizationId) {
          throw new BadRequestException('Admin can only create PI or Collaborator users for their associated organization');
        }
      }
    }

    // Handle organization association
    if (createUserDto.roles.includes(Role.ADMIN)) {
      // For admin users, inherit organization from creator if available
      if (creator?.organization) {
        createUserDto.organization = creator.organization;
      } else {
        // If no organization is specified for admin, don't associate with any
        createUserDto.organization = null;
      }
    } else {
      // For non-admin users, validate and set the organization
      const organization = await this.validateOrganizationId(organizationId);
      createUserDto.organization = organization;
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(organizationId: string): Promise<UserEntity[]> {
    await this.validateOrganizationId(organizationId);
    return this.userRepository.find({ 
      where: { organization: { id: organizationId } }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, organizationId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.validateOrganizationId(organizationId);
    if (user.organization?.id !== organizationId) {
      throw new BadRequestException('User does not belong to the specified organization');
    }
    
    if (updateUserDto.password && updateUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string, organizationId?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If organizationId is provided, validate it and check if the user belongs to that organization
    if (organizationId) {
      await this.validateOrganizationId(organizationId);
      if (user.organization?.id !== organizationId) {
        throw new BadRequestException('User does not belong to the specified organization');
      }
    } else {
      // If no organizationId is provided, ensure the user is not an admin
      // This prevents accidental deletion of admin users
      if (user.roles.includes(Role.ADMIN)) {
        throw new BadRequestException('Cannot delete admin users without specifying an organization');
      }
    }

    await this.userRepository.remove(user);
  }

  async deleteAll(organizationId: string): Promise<void> {
    await this.validateOrganizationId(organizationId);
    await this.userRepository.delete({ organization: { id: organizationId } });
  }
}
