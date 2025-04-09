import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubmitterListenerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateSubmitterListenerToken(): string {
    const payload = {
      sub: 'submitter-listener',
      username: 'submitter-listener',
      roles: ['submitter_listener'],
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h', // Token expires in 1 hour
    });
  }

  validateSubmitterListenerToken(token: string): boolean {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return decoded.roles.includes('submitter_listener');
    } catch {
      return false;
    }
  }
} 