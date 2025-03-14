import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../shared/security/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
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
