import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from './hashing/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  private async createTokens(user: User) {
    const accessToken = await this.signJwtAsync<Partial<User>>(
      user.id,
      this.jwtConfiguration.jwtTtl,
      { email: user.email },
    );

    const refreshToken = await this.signJwtAsync(
      user.id,
      this.jwtConfiguration.jwtRefreshTtl,
    );

    return { accessToken, refreshToken };
  }

  private async signJwtAsync<T>(sub: number, expiresIn: number, payload?: T) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: sub,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );

    return accessToken;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOneBy({
      email: loginDto.email,
      active: true,
    });

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createTokens(user);
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        this.jwtConfiguration,
      );

      if (typeof sub !== 'number') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.userRepository.findOneBy({
        id: sub,
        active: true,
      });

      if (!user) {
        throw new UnauthorizedException('User not authorized');
      }

      return this.createTokens(user);
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Erro na atualização do token',
      );
    }
  }
}
