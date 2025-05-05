/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from './hashing/hashing.service';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UnauthorizedException } from '@nestjs/common';
import jwtConfig from './config/jwt.config';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let hashingService: HashingService;
  let userRepository: Repository<User>;

  // Mock data
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    notesSent: [],
    notesReceived: [],
    picture: '',
  };

  const mockTokens = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
  };

  const mockJwtConfig = {
    secret: 'testSecret',
    audience: 'testAudience',
    issuer: 'testIssuer',
    jwtTtl: 3600,
    jwtRefreshTtl: 86400,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockImplementation((payload, options) => {
              // Simula o comportamento real baseado no expiresIn
              if (options?.expiresIn === mockJwtConfig.jwtTtl) {
                return Promise.resolve(mockTokens.accessToken);
              }
              return Promise.resolve(mockTokens.refreshToken);
            }),
            verifyAsync: jest.fn().mockResolvedValue({ sub: mockUser.id }),
          },
        },
        {
          provide: HashingService,
          useValue: {
            compare: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    hashingService = module.get<HashingService>(HashingService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens for valid credentials', async () => {
      const result = await service.login(loginDto);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: loginDto.email,
        active: true,
      });
      expect(hashingService.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('User not authorized'),
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (hashingService.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid_refresh_token',
    };

    it('should return new tokens for valid refresh token', async () => {
      const result = await service.refreshTokens(refreshTokenDto);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        mockJwtConfig,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
        active: true,
      });
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token'),
      );

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (userRepository.findOneBy as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(
        new UnauthorizedException('User not authorized'),
      );
    });

    it('should throw UnauthorizedException for invalid token payload', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({
        sub: 'invalid',
      });

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(
        new UnauthorizedException('Token inválido'),
      );
    });
  });

  // Testes indiretos para os métodos privados através do comportamento público
  describe('token generation', () => {
    it('should generate access token with email claim', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      await service.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
        },
        {
          audience: mockJwtConfig.audience,
          issuer: mockJwtConfig.issuer,
          secret: mockJwtConfig.secret,
          expiresIn: mockJwtConfig.jwtTtl,
        },
      );
    });

    it('should generate refresh token without email claim', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      await service.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
        },
        {
          audience: mockJwtConfig.audience,
          issuer: mockJwtConfig.issuer,
          secret: mockJwtConfig.secret,
          expiresIn: mockJwtConfig.jwtRefreshTtl,
        },
      );
    });
  });
});
