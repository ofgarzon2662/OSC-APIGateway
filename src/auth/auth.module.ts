import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { jwtConstants } from '../shared/security/constants';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
   imports: [
       UserModule,
       PassportModule,
       JwtModule.registerAsync({
         imports: [ConfigModule],
         useFactory: async (configService: ConfigService) => ({
           secret: configService.get<string>('JWT_SECRET', jwtConstants.JWT_SECRET),
           signOptions: { 
             expiresIn: configService.get<string>('JWT_EXPIRES_IN', jwtConstants.JWT_EXPIRES_IN) 
           },
         }),
         inject: [ConfigService],
       }),
     ],
   providers: [AuthService, UserService, JwtService, LocalStrategy, JwtStrategy],
   exports: [AuthService]
})
export class AuthModule {}