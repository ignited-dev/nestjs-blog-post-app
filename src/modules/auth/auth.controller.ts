import {
  Req,
  Post,
  Body,
  Param,
  Logger,
  HttpCode,
  UseGuards,
  Controller,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { User } from '@modules/user/user.entity';
import { UserDto } from '@modules/user/dtos/user.dto';
import { AuthService } from '@modules/auth/auth.service';
import { ConflictResponseDto } from './dtos/conflict.dto';
import { Serialize } from '@interceptors/serialize.interceptor';
import { CurrentUser } from '@decorators/current-user.decorator';
import { CreateUserDto } from '@modules/user/dtos/create-user.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TCurrentUser } from '@modules/user/typings/current-user.type';
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { ForgotPasswordDto } from '@modules/auth/dtos/forgot-password.dto';
import { ChangePasswordDto } from '@modules/auth/dtos/change-password.dto';
import { SignInResponseDto } from '@modules/auth/dtos/signIn-response.dto';
import { ResetPasswordBodyDto } from '@modules/auth/dtos/reset-password.dto';
import { ApiSuccessResponseDto } from '@/common/api-responses/ApiSuccessResponseDto';
import { ApiNotFoundResponseDto } from '@common/api-responses/ApiNotFoundResponse.dto';
import { ApiBadRequestResponseDto } from '@common/api-responses/ApiBadRequestResponseDto';
import { ForgotPasswordResponseDto } from '@modules/auth/dtos/forgot-password-response.dto';
import { ApiUnauthorizedResponseDto } from '@common/api-responses/ApiUnauthorizeResponse.dto';
import { SignInDto } from '../user/dtos/sign-in.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  @Serialize(UserDto)
  @ApiResponse({
    description: 'Newly Created User',
    type: UserDto,
    status: 201,
  })
  @ApiConflictResponse({
    type: ConflictResponseDto,
  })
  signUp(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(
      `Creating new user with payload = ${JSON.stringify(createUserDto)}`,
    );
    return this.authService.signUp(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/sign-in')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Api access credentials.',
    type: SignInResponseDto,
  })
  @ApiUnauthorizedResponse({ type: ApiUnauthorizedResponseDto })
  signIn(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
  ): Promise<SignInResponseDto> {
    return this.authService.signIn(req.user);
  }

  @Post('/forgot-password')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Password reset link',
    type: ForgotPasswordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
    type: ApiNotFoundResponseDto,
  })
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password/:id/:token')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'Id of user.', example: 1 })
  @ApiParam({
    name: 'token',
    description: 'Token sent in response of forgot password',
    example: 'w6OvJaI83ln6uLLc7yRT2VHoDQ1_ShY43M4oTD3XpPo',
  })
  @ApiResponse({
    description: 'Success response of password reset.',
    status: 200,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request exception',
    type: ApiBadRequestResponseDto,
  })
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Param('token') token: string,
    @Body() resetPasswordBodyDto: ResetPasswordBodyDto,
  ): Promise<void> {
    return this.authService.resetPassword({ id, token }, resetPasswordBodyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: ApiSuccessResponseDto,
    description: 'Success message of password change.',
  })
  @ApiBadRequestResponse({ type: ApiBadRequestResponseDto })
  @ApiNotFoundResponse({ type: ApiNotFoundResponseDto })
  changePassword(
    @CurrentUser() user: TCurrentUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(changePasswordDto, user);
  }

  @Post('/refresh-token')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Api access credentials.',
    type: SignInResponseDto,
  })
  @ApiBadRequestResponse({ type: ApiBadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: ApiUnauthorizedResponseDto })
  getAccessToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<SignInResponseDto> {
    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required!');
    }

    return this.authService.getAccessTokenUsingRefreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ type: ApiUnauthorizedResponseDto })
  @ApiResponse({ description: 'Success response of logout.', status: 200 })
  logout(@CurrentUser() user: TCurrentUser): Promise<number> {
    return this.authService.logoutUser(user);
  }
}
