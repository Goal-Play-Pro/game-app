import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      // Mock authentication for development
      request.user = { 
        userId: 'mock-user-id',
        sub: 'mock-user-id',
        wallet: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
        chainType: 'ethereum'
      };
      console.log('🔐 Using mock authentication:', request.user);
      return true;
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      console.log('🔐 JWT authentication successful:', payload);
      return true;
    } catch {
      // Fallback to mock user for development
      request.user = { 
        userId: 'mock-user-id',
        sub: 'mock-user-id',
        wallet: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
        chainType: 'ethereum'
      };
      console.log('🔐 JWT failed, using mock authentication:', request.user);
      return true;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}