import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SubmitterListenerAuthService } from './submitter-listener-auth.service';

describe('SubmitterListenerAuthService', () => {
  let service: SubmitterListenerAuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    const jwtSecret = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitterListenerAuthService,
        { provide: JwtService, useValue: new JwtService({ secret: jwtSecret }) },
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => (key === 'JWT_SECRET' ? jwtSecret : undefined)) } },
      ],
    }).compile();

    service = module.get(SubmitterListenerAuthService);
    jwt = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateSubmitterListenerToken returns a valid JWT with expected payload', () => {
    const token = service.generateSubmitterListenerToken();
    expect(typeof token).toBe('string');

    const decoded: any = jwt.verify(token, { secret: 'test-secret' });
    expect(decoded.sub).toBe('submitter-listener');
    expect(decoded.username).toBe('submitter-listener');
    expect(decoded.roles).toContain('submitter_listener');
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(3600);
  });

  it('validateSubmitterListenerToken returns true for generated token', () => {
    const token = service.generateSubmitterListenerToken();
    expect(service.validateSubmitterListenerToken(token)).toBe(true);
  });

  it('validateSubmitterListenerToken returns false for token with wrong secret', () => {
    // Sign with a different secret so verification fails
    const foreignJwt = new JwtService({ secret: 'wrong-secret' });
    const badToken = foreignJwt.sign({ sub: 'submitter-listener', username: 'submitter-listener', roles: ['submitter_listener'] }, { expiresIn: '1h' });
    expect(service.validateSubmitterListenerToken(badToken)).toBe(false);
  });

  it('validateSubmitterListenerToken returns false if role is missing', () => {
    const token = jwt.sign({ sub: 'submitter-listener', username: 'submitter-listener', roles: ['other'] }, { expiresIn: '1h' });
    expect(service.validateSubmitterListenerToken(token)).toBe(false);
  });
});


