import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../shared/security/constants';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService { 
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService
  ) {}

  async validateUser(username: string, password: string): Promise<boolean> {
    // Look for the user in the repo with UserRepository, not the UserService
    const user = await this.userRepository.findOne({
      where: [
        { username: username },
        { email: username },
      ],
    });

    if (!user) {
      throw new BusinessLogicException('Invalid credentials', BusinessError.UNAUTHORIZED);
    }

    // Compare the provided password with the stored password
    const isMatch = await this.passwordService.comparePasswords(password, user.password);

    if (!isMatch) {
      throw new BusinessLogicException('Invalid credentials', BusinessError.UNAUTHORIZED);
    }

    return true;
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
