import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { UserCreateDto } from './dto/userCreate.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import { UserGetDto } from './dto/userGet.dto';
import { plainToClass } from 'class-transformer';
import { User } from './user';
import { Role } from '../shared/enums/role.enums';
import { OrganizationEntity } from '../organization/organization.entity';
import * as validator from 'validator';



@Injectable()
export class UserService {
  private readonly users: User[] = [];

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

  private async saveAdminUserToDb(username: string, password: string, roles: string[]): Promise<void> {
    const hashedPassword = await this.passwordService.hashPassword(password);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      name: username,
      email: `${username}@example.com`,
      roles: roles as Role[]
    });
    await this.userRepository.save(user);
  }

  /**
   * Find a user by username or email for authentication purposes
   * This method is only used by the auth service and includes the password
   * @param username The username or email to search for
   * @returns The user data including password for authentication
   */
  async findOneForAuth(username: string): Promise<any> {
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

    return {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      email: foundUser.email,
      password: foundUser.password, // Include password for authentication
      roles: foundUser.roles || [], // Include roles for authorization
    };
  }

  /**
   * Find a user by username or email
   * This method is for general use and does not include sensitive data
   * @param username The username or email to search for
   * @returns The user data without sensitive information
   */
  async findOne(username: string): Promise<any> {
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

    // Return user data without sensitive information
    return {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      email: foundUser.email,
      roles: foundUser.roles || [],
      organization: foundUser.organization
    };
  }

  /**
   * Validate user input data (username, email, name, password)
   */
  private validateUserInputData(createUserDto: UserCreateDto): void {
    // Validate username length
    if (!createUserDto.username || createUserDto.username.length < 8 || createUserDto.username.length > 50) {
      throw new BadRequestException('Username must be between 8 and 50 characters long');
    }

    // Validate email format
    if (!createUserDto.email || !validator.isEmail(createUserDto.email)) {
      throw new BadRequestException('Email must be a valid email address');
    }

    // Validate name length
    if (!createUserDto.name || createUserDto.name.length < 3 || createUserDto.name.length > 50) {
      throw new BadRequestException('Name must be between 3 and 50 characters long');
    }

    // Validate password length
    if (createUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
  }

  /**
   * Validate creator permissions for creating a user with the specified role
   */
  private validateCreatorPermissions(creator: UserEntity, requestedRole: Role): void {
    // Check if creator is an admin or PI
    if (!creator.roles.includes(Role.ADMIN) && !creator.roles.includes(Role.PI)) {
      throw new BadRequestException('Only admins and PIs can create users');
    }

    // If creator is a PI and not an admin, they can only create PI or COLLABORATOR users
    if (creator.roles.includes(Role.PI) && !creator.roles.includes(Role.ADMIN)) {
      if (requestedRole !== Role.PI && requestedRole !== Role.COLLABORATOR) {
        throw new BadRequestException('PI can only create PI or COLLABORATOR users');
      }
    }
  }

  /**
   * Check if user with the same username or email already exists
   */
  private async checkUserExists(username: string, email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username },
        { email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('User with this username or email already exists');
    }
  }

  /**
   * Create a user entity and save it to the database
   */
  private async createAndSaveUser(
    createUserDto: UserCreateDto, 
    roles: Role[], 
    organization: OrganizationEntity | null
  ): Promise<UserEntity> {
    const hashedPassword = await this.passwordService.hashPassword(createUserDto.password);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
      organization
    });
    
    return await this.userRepository.save(user);
  }

  // Create a new user
  async create(createUserDto: UserCreateDto, creator: UserEntity): Promise<UserGetDto> {
    // Check if user already exists
    await this.checkUserExists(createUserDto.username, createUserDto.email);
    
    // Validate input data
    this.validateUserInputData(createUserDto);
    
    // Validate creator permissions
    this.validateCreatorPermissions(creator, createUserDto.role);

    // Convert single role string to array
    const roles = [createUserDto.role];

    try {
      let organization = null;
      
      // For non-admin users, associate with organization
      if (createUserDto.role !== Role.ADMIN) {
        organization = await this.organizationRepository.findOne({
          where: {} // Get the first (and only) organization
        });

        if (!organization) {
          throw new BadRequestException('Cannot create PI or Collaborator users: No organization exists in the system');
        }
      }

      // Create and save the user
      const savedUser = await this.createAndSaveUser(createUserDto, roles, organization);
      
      // Transform to DTO for response
      return this.transformToDto(savedUser);
    } catch (error) {
      if (error instanceof BadRequestException) {
        if (error.message === 'Cannot create PI or Collaborator users: No organization exists in the system') {
          throw new BadRequestException(`Failed to associate user with organization: ${error.message}`);
        }
        throw error;
      }
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  private transformToDto(user: UserEntity): UserGetDto {
    const dto = plainToClass(UserGetDto, user, { excludeExtraneousValues: true });
    // Add organization name if organization exists
    if (user.organization) {
      (dto as any).organizationName = user.organization.name;
    }
    return dto;
  }

  async findAll(): Promise<UserGetDto[]> {
    const users = await this.userRepository.find({
      relations: ['organization']
    });
    return users.map(user => this.transformToDto(user));
  }

  /**
   * Finds a user by ID or throws an exception if not found
   */
  private async findUserByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    
    return user;
  }

  /**
   * Validates update permissions based on user roles and update context
   */
  private validateUpdatePermissions(
    userToUpdate: UserEntity, 
    currentUser: UserEntity, 
    updateUserDto: UserUpdateDto
  ): void {
    const isSelfUpdate = currentUser.id === userToUpdate.id;

    // If updating another user
    if (!isSelfUpdate) {
      // Admin can only update non-admin users
      if (userToUpdate.roles.includes(Role.ADMIN)) {
        throw new UnauthorizedException('Only the user themselves can update an admin user');
      }
    }

    // If self-updating and user is an admin, prevent email/username changes
    if (isSelfUpdate && currentUser.roles.includes(Role.ADMIN)) {
      this.validateAdminSelfUpdate(userToUpdate, updateUserDto);
    }

    // Validate role updates
    const hasRoleUpdate = updateUserDto.role !== undefined;
    if (hasRoleUpdate) {
      if (isSelfUpdate) {
        throw new UnauthorizedException('Users cannot update their own roles');
      }
    }
  }

  /**
   * Validates admin self-update restrictions
   */
  private validateAdminSelfUpdate(userToUpdate: UserEntity, updateUserDto: UserUpdateDto): void {
    if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
      throw new UnauthorizedException('Admins cannot change their own email');
    }
    if (updateUserDto.username && updateUserDto.username !== userToUpdate.username) {
      throw new UnauthorizedException('Admins cannot change their own username');
    }
  }

  /**
   * Validates uniqueness of username and email
   */
  private async validateFieldUniqueness(
    userToUpdate: UserEntity, 
    updateUserDto: UserUpdateDto
  ): Promise<void> {
    if (updateUserDto.username && updateUserDto.username !== userToUpdate.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username }
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }
  }

  /**
   * Validates password requirements
   */
  private validatePassword(password: string): void {
    if (password && password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
  }

  /**
   * Prepares user data for update
   */
  private async prepareUpdateData(updateUserDto: UserUpdateDto): Promise<any> {
    const updateData: any = {};
    
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.username !== undefined) updateData.username = updateUserDto.username;
    if (updateUserDto.password !== undefined) {
      updateData.password = await this.passwordService.hashPassword(updateUserDto.password);
    }
    
    // Convert single role to array if needed
    if (updateUserDto.role !== undefined) {
      updateData.roles = [updateUserDto.role];
    }
    
    return updateData;
  }

  async update(id: string, updateUserDto: UserUpdateDto, currentUser: UserEntity): Promise<UserGetDto> {
    // Find the user to update
    const userToUpdate = await this.findUserByIdOrThrow(id);
    
    // Validate update permissions
    this.validateUpdatePermissions(userToUpdate, currentUser, updateUserDto);
    
    // Check for username and email uniqueness
    const isSelfUpdateByAdmin = (currentUser.id === userToUpdate.id) && currentUser.roles.includes(Role.ADMIN);
    if (!isSelfUpdateByAdmin) {
      await this.validateFieldUniqueness(userToUpdate, updateUserDto);
    }
    
    // Validate password
    this.validatePassword(updateUserDto.password);
    
    // Prepare update data
    const updateData = await this.prepareUpdateData(updateUserDto);
    
    // Update the user
    const updatedUser = await this.userRepository.save({
      ...userToUpdate,
      ...updateData
    });

    // Create response
    const response = this.transformToDto(updatedUser);
    if (updateUserDto.password) {
      (response as any).requiresRelogin = true;
    }

    return response;
  }

  async remove(id: string, currentUser: UserEntity): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verificar permisos según el rol del usuario actual
    if (currentUser.roles.includes(Role.PI) && !currentUser.roles.includes(Role.ADMIN)) {
      // Un PI no puede eliminar usuarios ADMIN
      if (user.roles.includes(Role.ADMIN)) {
        throw new BadRequestException('PI cannot delete admin users');
      }
      
      // Un PI solo puede eliminar usuarios con rol COLLABORATOR (y ningún otro rol)
      if (user.roles.length !== 1 || user.roles[0] !== Role.COLLABORATOR) {
        throw new BadRequestException('PI can only delete users with role COLLABORATOR');
      }
    } else if (currentUser.roles.includes(Role.ADMIN)) {
      // Un ADMIN no puede eliminar a otro ADMIN
      if (user.roles.includes(Role.ADMIN)) {
        throw new BadRequestException('Admin cannot delete another admin user');
      }
    }

    await this.userRepository.remove(user);
  }

  /**
   * Find a user by ID
   * This method is for general use and does not include sensitive data
   * @param id The user ID to search for
   * @returns The user data without sensitive information
   */
  async findOneById(id: string): Promise<UserGetDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Return user data without sensitive information
    return this.transformToDto(user);
   }
}
