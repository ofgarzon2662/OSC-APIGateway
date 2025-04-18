import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../shared/security/constants';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { PasswordService } from './password.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService { 
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      // Use the authentication-specific method that includes the password
      const user = await this.userService.findOneForAuth(username);
      
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
      email: req.user.email,
    };
    return {
      token: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET', jwtConstants.JWT_SECRET),
      }),
    };
  }

  /**
   * Log out a user by blacklisting their token
   * @param token The JWT token to blacklist
   * @returns A success message
   */
  async logout(token: string): Promise<{ message: string }> {
    // Add the token to the blacklist
    this.tokenBlacklistService.blacklistToken(token);

    // Return a success message
    return { message: 'Logout successful' };
  }
}
