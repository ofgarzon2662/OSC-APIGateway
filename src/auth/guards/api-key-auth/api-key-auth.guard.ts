import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const serviceRole = request.headers['x-service-role'] as string;
    
    if (!apiKey || !serviceRole) {
      throw new UnauthorizedException('API Key and Service Role headers are required');
    }

    // Get configuration from environment
    const expectedApiKey = this.configService.get<string>('SUBMISSION_LISTENER_API_KEY');
    const expectedServiceRole = this.configService.get<string>('SUBMISSION_LISTENER_SERVICE_ROLE', 'submitter_listener');
    const serviceUsername = this.configService.get<string>('SUBMISSION_LISTENER_USERNAME', 'submitter-listener');
    
    if (!expectedApiKey) {
      throw new UnauthorizedException('API Key not configured');
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Validate service role using environment variable
    if (serviceRole !== expectedServiceRole) {
      throw new UnauthorizedException(`Invalid Service Role. Expected: ${expectedServiceRole}`);
    }

    // Add user information to request for role-based access (using env vars)
    (request as any).user = {
      username: serviceUsername,
      roles: [expectedServiceRole],
      apiKeyAuth: true,
    };

    return true;
  }
} 