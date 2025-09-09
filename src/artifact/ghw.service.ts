import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

interface HistoryQuery {
  artifactId: string;
  offset: number;
  limit: number;
  order: 'asc' | 'desc';
  includeValue: boolean;
}

@Injectable()
export class GhwService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('GHW_URL', 'http://localhost:8002');
  }

  async fetchHistory(query: HistoryQuery, correlationId: string): Promise<any> {
    const url = new URL('/history', this.baseUrl);
    url.searchParams.set('artifactId', query.artifactId);
    url.searchParams.set('offset', String(query.offset));
    url.searchParams.set('limit', String(query.limit));
    url.searchParams.set('order', query.order);
    url.searchParams.set('includeValue', String(query.includeValue));
    return this.getJson(url.toString(), correlationId);
  }

  async refresh(artifactId: string, correlationId: string): Promise<any> {
    const url = new URL('/history/refresh', this.baseUrl);
    url.searchParams.set('artifactId', artifactId);
    return this.getJson(url.toString(), correlationId);
  }

  private async getJson(fullUrl: string, correlationId: string): Promise<any> {
    const url = new URL(fullUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const connectTimeoutMs = 2000;
    const readTimeoutMs = 10000;

    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        method: 'GET',
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'accept': 'application/json',
          'x-correlation-id': correlationId,
          'connection': 'keep-alive',
        },
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');

        // Read timeout
        res.setTimeout(readTimeoutMs, () => {
          req.destroy(new Error('READ_TIMEOUT'));
        });

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const status = res.statusCode || 500;
            if (status < 200 || status >= 300) {
              const err = new Error(`UPSTREAM_${status}`);
              (err as any).statusCode = status;
              (err as any).body = data;
              reject(err);
              return;
            }
            const json = data ? JSON.parse(data) : {};
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      });

      // Connect timeout
      const connectTimer = setTimeout(() => {
        req.destroy(new Error('CONNECT_TIMEOUT'));
      }, connectTimeoutMs);

      req.on('socket', (socket) => {
        socket.on('connect', () => {
          clearTimeout(connectTimer);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }
}


