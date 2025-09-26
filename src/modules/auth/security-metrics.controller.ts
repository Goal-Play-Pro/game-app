import { Controller, Get, Header, Headers, UnauthorizedException } from '@nestjs/common';
import { SecurityMetricsService } from '../../common/services/security-metrics.service';

@Controller('auth/security')
export class SecurityMetricsController {
  constructor(private readonly metrics: SecurityMetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getMetrics(@Headers('x-metrics-key') token?: string): string {
    const expectedToken = process.env.SECURITY_METRICS_TOKEN;
    if (expectedToken && token !== expectedToken) {
      throw new UnauthorizedException('Invalid metrics token');
    }
    return this.metrics.toPrometheus();
  }
}
