import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './dto/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Role is never taken from the request — every self-registered
    // account is a TEAM_MEMBER. Managers are seeded or promoted later.
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: Role.TEAM_MEMBER,
    });

    return this.toSafeUser(user);
  }

  async validateCredentials(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    return user;
  }

  issueTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
    });
  }

  // Never send passwordHash to the frontend, even by accident
  toSafeUser(user: { _id: unknown; name: string; email: string; role: Role }) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
