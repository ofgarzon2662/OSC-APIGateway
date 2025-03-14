import { Injectable } from '@nestjs/common';
import { User } from './user';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class UserService {
   private users: User[] = [];
   
   constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>
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

   async findOne(username: string): Promise<User | undefined> {
      return this.users.find(user => user.username === username);
   }

   async create(user: Partial<UserEntity>): Promise<UserEntity> {
      const newUser = this.userRepository.create(user);
      return this.userRepository.save(newUser);
   }

   async findAll(): Promise<UserEntity[]> {
      return this.userRepository.find();
   }
}
