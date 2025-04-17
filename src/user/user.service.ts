import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { UserCreateDto } from './dto/userCreate.dto';
import {
  BusinessError,
  BusinessLogicException,
} from '../shared/errors/business-errors';
import { UserGetDto } from './dto/userGet.dto';
import { plainToClass } from 'class-transformer';
import { User } from './user';
import { Role } from '../shared/enums/role.enums';
import { OrganizationEntity } from '../organization/organization.entity';



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

  /**
   * Find a user by username or email
   * @param username The username or email to search for
   * @returns The user data
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
  async getOne(username: string): Promise<UserGetDto> {
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

    return plainToClass(UserGetDto, user, { excludeExtraneousValues: true });
  }

  // Create a new user
  async create(createUserDto: UserCreateDto, creator: UserEntity): Promise<UserGetDto> {
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

    // Convert single role string to array
    const roles = [createUserDto.role];

    // Check if creator is an admin or PI
    if (!creator.roles.includes(Role.ADMIN) && !creator.roles.includes(Role.PI)) {
      throw new BadRequestException('Only admins and PIs can create users');
    }

    // If creator is a PI, they can only create PI or COLLABORATOR users
    if (creator.roles.includes(Role.PI) && !creator.roles.includes(Role.ADMIN)) {
      if (createUserDto.role !== Role.PI && createUserDto.role !== Role.COLLABORATOR) {
        throw new BadRequestException('PI can only create PI or COLLABORATOR users');
      }
    }

    // Check if creating non-admin users (PI or COLLABORATOR)
    const isCreatingNonAdmin = createUserDto.role !== Role.ADMIN;

    if (isCreatingNonAdmin) {
      try {
        // For non-admin users, we need to associate them with the existing organization
        const organization = await this.organizationRepository.findOne({
          where: {} // This will get the first (and only) organization
        });

        if (!organization) {
          throw new BadRequestException('Cannot create PI or Collaborator users: No organization exists in the system');
        }

        // Create user entity with organization
        const user = this.userRepository.create({
          ...createUserDto,
          roles,
          organization
        });
        const savedUser = await this.userRepository.save(user);
        return plainToClass(UserGetDto, savedUser, { excludeExtraneousValues: true });
      } catch (error) {
        throw new BadRequestException(`Failed to associate user with organization: ${error.message}`);
      }
    } else {
      // For admin users, don't associate with any organization
      const user = this.userRepository.create({
        ...createUserDto,
        roles,
        organization: null
      });
      const savedUser = await this.userRepository.save(user);
      return plainToClass(UserGetDto, savedUser, { excludeExtraneousValues: true });
    }
  }

  async findAll(): Promise<UserGetDto[]> {
    const users = await this.userRepository.find({
      relations: ['organization']
    });
    return users.map(user => plainToClass(UserGetDto, user, { excludeExtraneousValues: true }));
  }

  async update(id: string, updateUserDto: UserCreateDto): Promise<UserGetDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password && updateUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Convert single role string to array if role is being updated
    if (updateUserDto.role) {
      user.roles = [updateUserDto.role];
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);
    return plainToClass(UserGetDto, savedUser, { excludeExtraneousValues: true });
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }
}
