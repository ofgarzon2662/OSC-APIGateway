import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtService } from '@nestjs/jwt';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let jwtService: JwtService;

  // Mock JWT service
  const mockJwtService = {
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blacklistToken', () => {
    it('should add a token to the blacklist without Bearer prefix', () => {
      const token = 'test.token.123';
      service.blacklistToken(token);
      expect(service.isBlacklisted(token)).toBe(true);
    });

    it('should add a token to the blacklist with Bearer prefix', () => {
      const token = 'test.token.123';
      service.blacklistToken(`Bearer ${token}`);
      expect(service.isBlacklisted(token)).toBe(true);
    });

    it('should not add duplicate tokens', () => {
      const token = 'test.token.123';
      service.blacklistToken(token);
      service.blacklistToken(token);
      expect(service.getBlacklistSize()).toBe(1);
    });
  });

  describe('isBlacklisted', () => {
    it('should return true for blacklisted token without Bearer prefix', () => {
      const token = 'test.token.123';
      service.blacklistToken(token);
      expect(service.isBlacklisted(token)).toBe(true);
    });

    it('should return true for blacklisted token with Bearer prefix', () => {
      const token = 'test.token.123';
      service.blacklistToken(token);
      expect(service.isBlacklisted(`Bearer ${token}`)).toBe(true);
    });

    it('should return false for non-blacklisted token', () => {
      expect(service.isBlacklisted('non.existent.token')).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens from blacklist', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = 'expired.token.123';
      const validToken = 'valid.token.123';

      // Mock JWT decode to simulate expired token
      mockJwtService.decode.mockImplementation((token) => {
        if (token === expiredToken) {
          return { exp: now - 1000 }; // Expired 1000 seconds ago
        }
        return { exp: now + 1000 }; // Valid for 1000 more seconds
      });

      service.blacklistToken(expiredToken);
      service.blacklistToken(validToken);

      service.cleanupExpiredTokens();

      expect(service.isBlacklisted(expiredToken)).toBe(false);
      expect(service.isBlacklisted(validToken)).toBe(true);
    });

    it('should remove invalid tokens from blacklist', () => {
      const invalidToken = 'invalid.token.123';
      const validToken = 'valid.token.123';

      // Mock JWT decode to throw error for invalid token
      mockJwtService.decode.mockImplementation((token) => {
        if (token === invalidToken) {
          throw new Error('Invalid token');
        }
        return { exp: Math.floor(Date.now() / 1000) + 1000 };
      });

      service.blacklistToken(invalidToken);
      service.blacklistToken(validToken);

      service.cleanupExpiredTokens();

      expect(service.isBlacklisted(invalidToken)).toBe(false);
      expect(service.isBlacklisted(validToken)).toBe(true);
    });
  });

  describe('getBlacklistSize', () => {
    it('should return correct size of blacklist', () => {
      const tokens = ['token1', 'token2', 'token3'];
      tokens.forEach(token => service.blacklistToken(token));
      expect(service.getBlacklistSize()).toBe(tokens.length);
    });

    it('should return 0 for empty blacklist', () => {
      expect(service.getBlacklistSize()).toBe(0);
    });
  });

  describe('lifecycle hooks', () => {
    let setIntervalSpy: jest.SpyInstance;
    let clearIntervalSpy: jest.SpyInstance;

    beforeEach(() => {
      setIntervalSpy = jest.spyOn(global, 'setInterval');
      clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    });

    afterEach(() => {
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });

    it('should initialize cleanup interval on module init', () => {
      service.onModuleInit();
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should clear cleanup interval on module destroy', () => {
      service.onModuleInit();
      service.onModuleDestroy();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should call cleanupExpiredTokens periodically', () => {
      jest.useFakeTimers();
      const cleanupSpy = jest.spyOn(service as any, 'cleanupExpiredTokens');
      
      service.onModuleInit();
      jest.advanceTimersByTime(60 * 60 * 1000); // Advance by 1 hour
      
      expect(cleanupSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
      cleanupSpy.mockRestore();
    });
  });
}); 