import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { jwtConstants } from '../shared/security/constants';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
   imports: [
       UserModule,
       PassportModule,
       JwtModule.register({
         secret: jwtConstants.JWT_SECRET,
         signOptions: { expiresIn: jwtConstants.JWT_EXPIRES_IN },
       })
     ],
   providers: [AuthService, UserService, JwtService, LocalStrategy, JwtStrategy],
   exports: [AuthService], controllers: [AuthController]
})
export class AuthModule {}