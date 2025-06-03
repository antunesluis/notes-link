import { Body, Controller, Post, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and returns JWT tokens',
  })
  @ApiBody({
    description: 'User credentials',
    type: LoginDto,
    examples: {
      valid: {
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Authentication successful',
    type: TokenResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Refresh token in HTTP-only cookie',
        schema: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh tokens',
    description: 'Generates new access token using refresh token',
  })
  @ApiBody({
    description: 'Refresh token',
    type: RefreshTokenDto,
    examples: {
      valid: {
        value: {
          refreshToken: 'valid.refresh.token',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tokens refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }
}
