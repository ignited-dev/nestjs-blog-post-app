import * as hpp from 'hpp';
import helmet from 'helmet';
import * as cors from 'cors';
import * as morgan from 'morgan';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { UtilsModule } from '@utils/util.module';
import AppConstants from '@constants/app.constant';
import { AppService } from '@modules/app/app.service';
import { AuthModule } from '@modules/auth/auth.module';
import { PostModule } from '@modules/post/post.module';
import { UserModule } from '@modules/user/user.module';
import { configValidationSchema } from '@/config.schema';
import { AppController } from '@modules/app/app.controller';
import { CommentModule } from '@modules/comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      load: [AppConstants],
      validationSchema: configValidationSchema,
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          config: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            username: configService.get<string>('REDIS_USER'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: configService.get<string>('DATABASE_TYPE') as
            | 'mysql'
            | 'postgres'
            | 'sqlite',
          database: configService.get<string>('DATABASE'),
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          synchronize:
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'test',
          autoLoadEntities: true,
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),
    UtilsModule,
    AuthModule,
    UserModule,
    CommentModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cors(), hpp(), helmet(), morgan('common')).forRoutes('*');
  }
}
