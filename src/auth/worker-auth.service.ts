import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateWorkerToken(): string {
    const payload = {
      sub: 'submitter-worker',
      username: 'submitter-worker',
      roles: ['submitter_worker'],
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h', // Token expires in 1 hour
    });
  }

  validateWorkerToken(token: string): boolean {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return decoded.roles.includes('submitter_worker');
    } catch {
      return false;
    }
  }
} 