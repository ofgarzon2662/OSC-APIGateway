import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../shared/security/constants';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { PasswordService } from './password.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService { 
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      // Look for the user in the repo with UserRepository, not the UserService
      const user = await this.userService.findOne(username);
      
      // Compare the provided password with the stored password
      const isMatch = await this.passwordService.comparePasswords(password, user.password);

      if (isMatch) {
        const { password, ...result } = user;
        return result;
      } else {
        throw new BusinessLogicException('Invalid credentials', BusinessError.UNAUTHORIZED);
      }
    } catch (error) {
      if (error instanceof BusinessLogicException) {
        throw error;
      }
      throw new BusinessLogicException('Invalid credentials', BusinessError.UNAUTHORIZED);
    }
  }

  


  async login(req: any) {
    const payload = {
      username: req.user.username,
      sub: req.user.id,
      roles: req.user.roles,
    };
    return {
      token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET', jwtConstants.JWT_SECRET),
      }),
    };
  }
}
