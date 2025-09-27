import { Module } from '@nestjs/common';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { OrganizationEntity } from './organization/organization.entity';
import { ArtifactEntity } from './artifact/artifact.entity';
import { ArtifactModule } from './artifact/artifact.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    OrganizationModule,
    ArtifactModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const useSsl = configService.get<string>('DB_SSL', 'false') === 'true';
        let sslOption: any = undefined;

        if (useSsl) {
          const caPath = process.env.PGSSL_CA_PATH || '/usr/local/share/ca-certificates/aws-rds-global-bundle.crt';
          let caContent: string | undefined = undefined;
          try {
            if (caPath && fs.existsSync(caPath)) {
              caContent = fs.readFileSync(caPath, 'utf8');
            }
          } catch {}

          const rejectUnauthorizedEnv = configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED');
          const rejectUnauthorized = rejectUnauthorizedEnv ? rejectUnauthorizedEnv !== 'false' : true;
          const servername = configService.get<string>('DB_SSL_SERVERNAME');

          const opts: any = { rejectUnauthorized };
          if (caContent) opts.ca = caContent;
          if (servername) opts.servername = servername;

          // If no CA provided, Node will use its trust store (augmented by NODE_EXTRA_CA_CERTS)
          sslOption = opts;
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'organization'),
          entities: [UserEntity, OrganizationEntity, ArtifactEntity],
          dropSchema: true,
          synchronize: true,
          keepConnectionAlive: true,
          ssl: sslOption,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
