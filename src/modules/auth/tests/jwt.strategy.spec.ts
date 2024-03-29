import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UserService } from '@modules/user/user.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { UserServiceMock } from '@modules/user/tests/mocks/user.service.mock';
import { ConfigServiceMock } from '@modules/auth/tests/mocks/config.service.mock';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useClass: ConfigServiceMock,
        },
        {
          provide: UserService,
          useClass: UserServiceMock,
        },
      ],
    }).compile();

    strategy = moduleRef.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it("Should return false if user doesn't exists in system", async () => {
      const result = await strategy.validate({
        userId: 1,
        iat: 2564,
        exp: 12345,
        iss: 'string',
        sub: 'string',
        aud: 'string',
      });

      expect(result).toBeDefined();
      expect(result).toEqual(false);
      expect(result).toBeFalsy();
    });
  });
});
