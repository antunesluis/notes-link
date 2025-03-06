import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { REQUEST_TOKEN_PAYLOAD_KEY } from '../auth.constants';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('User not logged in');
    }

    try {
      // Verify the token and attach the payload to the request object
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      // Attach the payload to the request object
      request[REQUEST_TOKEN_PAYLOAD_KEY] = payload;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }

    return true;
  }

  extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
