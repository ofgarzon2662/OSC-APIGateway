import { Module, forwardRef } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { jwtConstants } from '../shared/security/constants';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';

@Module({
   imports: [
       forwardRef(() => UserModule),
       PassportModule,
       TypeOrmModule.forFeature([UserEntity]),
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
   providers: [AuthService, JwtService, LocalStrategy, JwtStrategy, PasswordService],
   exports: [AuthService, PasswordService]
})
export class AuthModule {}