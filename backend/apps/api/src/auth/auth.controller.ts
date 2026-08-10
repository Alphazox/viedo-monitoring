import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@video-analytics/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import type { JwtPayload } from './types/jwt-payload.type';
import { requestContext } from './utils/request-context';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: TokenResponseDto })
  login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    return this.authService.login(dto, requestContext(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: TokenResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: FastifyRequest) {
    return this.authService.refresh(dto, requestContext(req));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto, @CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(dto, user);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
