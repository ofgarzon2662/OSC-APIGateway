import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface DecodedToken {
  exp?: number;
  [key: string]: any;
}

@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  private readonly blacklistedTokens: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;
  // Default to cleaning up every hour
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Initialize cleanup timer when module is initialized
   */
  onModuleInit() {
    // Set up periodic cleanup of expired tokens
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Clean up resources when the service is destroyed
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Add a token to the blacklist
   * @param token The JWT token to blacklist
   */
  blacklistToken(token: string): void {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    this.blacklistedTokens.add(cleanToken);
    
    // Log blacklist size for monitoring (can be replaced with proper metrics in production)
    console.log(`Token blacklist size: ${this.blacklistedTokens.size}`);
  }

  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns true if the token is blacklisted, false otherwise
   */
  isBlacklisted(token: string): boolean {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    return this.blacklistedTokens.has(cleanToken);
  }

  /**
   * Clean up expired tokens from the blacklist
   * This is called periodically to prevent memory leaks
   */
  cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    let removedCount = 0;
    const startSize = this.blacklistedTokens.size;
    
    this.blacklistedTokens.forEach(token => {
      try {
        const decoded = this.jwtService.decode(token) as DecodedToken;
        if (decoded?.exp && decoded.exp < now) {
          this.blacklistedTokens.delete(token);
          removedCount++;
        }
      } catch (error) {
        // If token can't be decoded, remove it from blacklist
        this.blacklistedTokens.delete(token);
        removedCount++;
      }
    });
    
    console.log(`Cleaned up ${removedCount} expired tokens. Blacklist size reduced from ${startSize} to ${this.blacklistedTokens.size}`);
  }
  
  /**
   * Get the current size of the blacklist
   * @returns The number of tokens in the blacklist
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }
} 