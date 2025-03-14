import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { PasswordService } from '../auth/password.service';
import { UserCreateDto } from './userCreate.dto';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { UserGetDto } from './userGet.dto';
import { plainToClass } from 'class-transformer';
import { User } from './user';

@Injectable()
export class UserService {
   private users: User[] = [];
   
   constructor(
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
   ) {
      this.loadUsersFromEnv();
   }

   private loadUsersFromEnv(): void {
      // Load Admin User 1
      const admin1Username = this.configService.get<string>('ADMIN1_USERNAME');
      const admin1Password = this.configService.get<string>('ADMIN1_PASSWORD');
      const admin1RolesStr = this.configService.get<string>('ADMIN1_ROLES', 'admin');
      const admin1Roles = admin1RolesStr ? admin1RolesStr.split(',') : ['admin'];
      
      if (admin1Username && admin1Password) {
         this.users.push(new User(1, admin1Username, admin1Password, admin1Roles));
      }

      // Load Admin User 2
      const admin2Username = this.configService.get<string>('ADMIN2_USERNAME');
      const admin2Password = this.configService.get<string>('ADMIN2_PASSWORD');
      const admin2RolesStr = this.configService.get<string>('ADMIN2_ROLES', 'admin');
      const admin2Roles = admin2RolesStr ? admin2RolesStr.split(',') : ['admin'];
      
      if (admin2Username && admin2Password) {
         this.users.push(new User(2, admin2Username, admin2Password, admin2Roles));
      }

      // Fallback to default users if no env variables are set
      if (this.users.length === 0) {
         console.warn('No users found in environment variables. Using default users.');
         this.users = [
            new User(1, "admin", "admin", ["admin"]),
            new User(2, "user", "admin", ["admin"]),
         ];
      }
   }

   // Find a user by username or email
   async findOne(username: string): Promise<UserGetDto> {
      const foundUser = await this.userRepository.findOne({
         where: [
            { username: username },
            { email: username },
         ],
      });
      if (!foundUser) {
         throw new BusinessLogicException('User not found', BusinessError.NOT_FOUND);
      }
      return plainToClass(UserGetDto, foundUser, { excludeExtraneousValues: true });
   }

   //Instead of returning a UserEntity, return a UserGetDto
   async create(user: UserCreateDto): Promise<UserGetDto> {
      
      // Add conditions to check if usename or email already exists
      const existingUser = await this.userRepository.findOne({
         where: [
            { username: user.username },
            { email: user.email },
         ],
      });
      if (existingUser) {
         throw new BusinessLogicException(
            'Username or email already exists', 
            BusinessError.PRECONDITION_FAILED);
      }
      // Add conditions to check if that user.password is at least 8 characters long
      if (user.password.length < 8) {
         throw new BusinessLogicException(
            'Password must be at least 8 characters long', 
            BusinessError.PRECONDITION_FAILED);
      }
      // username must be unique and 8 characters long
      if (user.username.length < 8) {
         throw new BusinessLogicException(
            'Username must be at least 8 characters long', 
            BusinessError.PRECONDITION_FAILED);
      }
      // Hash the password
      const hashedPassword = await this.passwordService.hashPassword(user.password);
      // Create the new user
      const newUser = this.userRepository.create({
         name: user.name,
         username: user.username,
         email: user.email,
         password: hashedPassword,
      });
      const savedUser = await this.userRepository.save(newUser);
      return plainToClass(UserGetDto, savedUser, { excludeExtraneousValues: true });
   }

   async findAll(): Promise<UserGetDto[]> {
      const users = await this.userRepository.find();
      return users.map(user => plainToClass(UserGetDto, user, { excludeExtraneousValues: true }));
   }
}

