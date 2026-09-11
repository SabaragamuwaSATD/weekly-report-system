import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';

const REFRESH_COOKIE_PATH = '/api/auth/refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateCredentials(dto);

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = this.authService.issueTokens(payload);
    this.setAuthCookies(res, accessToken, refreshToken);

    return this.authService.toSafeUser(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload;
    try {
      payload = this.authService.verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const { accessToken, refreshToken } = this.authService.issueTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    this.setAuthCookies(res, accessToken, refreshToken);
    return { status: 'refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: REFRESH_COOKIE_PATH });
    return { status: 'logged out' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.config.get('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH, // only sent back on the /auth/refresh call
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
