import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller() // Sin prefijo para manejar rutas raíz
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint - API information' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'API information and available endpoints',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        timestamp: { type: 'string' },
        endpoints: {
          type: 'object',
          properties: {
            health: { type: 'string' },
            docs: { type: 'string' },
            api: { type: 'string' }
          }
        }
      }
    }
  })
  getRoot() {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Application health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        memory: { type: 'object' },
        environment: { type: 'string' }
      }
    }
  })
  getHealth() {
    return this.appService.getHealthCheck();
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'API version information' 
  })
  getVersion() {
    return this.appService.getVersion();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detailed application status' 
  })
  getStatus() {
    return this.appService.getDetailedStatus();
  }
}