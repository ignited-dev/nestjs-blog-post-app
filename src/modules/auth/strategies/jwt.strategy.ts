import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserService } from '@modules/user/user.service';
import { JwtPayloadType } from '@modules/auth/typings/auth.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: JwtPayloadType) {
    const { userId } = payload;
    const existingUser = await this.userService.findUserById(userId);
    if (!existingUser) return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = existingUser;
    return rest;
  }
}
