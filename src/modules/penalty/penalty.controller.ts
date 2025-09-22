import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PenaltyService } from './penalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('penalty')
@Controller('penalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PenaltyController {
  constructor(private readonly penaltyService: PenaltyService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get user penalty sessions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessions retrieved successfully' })
  async getUserSessions(@Request() req: any) {
    return this.penaltyService.getUserSessions(req.user.sub);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create penalty session' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Session created successfully' })
  async createSession(@Body() sessionData: any, @Request() req: any) {
    return this.penaltyService.createSession(req.user.sub, sessionData);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session details retrieved successfully' })
  async getSessionDetails(@Param('id') id: string, @Request() req: any) {
    return this.penaltyService.getSessionDetails(id, req.user.sub);
  }

  @Post('sessions/:id/attempts')
  @ApiOperation({ summary: 'Attempt penalty shot' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Penalty attempt processed successfully' })
  async attemptPenalty(@Param('id') sessionId: string, @Body() attemptData: any, @Request() req: any) {
    return this.penaltyService.attemptPenalty(sessionId, attemptData, req.user.sub);
  }

  @Post('sessions/:id/join')
  @ApiOperation({ summary: 'Join multiplayer session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined session successfully' })
  async joinSession(@Param('id') sessionId: string, @Body() joinData: any, @Request() req: any) {
    return this.penaltyService.joinSession(sessionId, joinData.playerId, req.user.sub);
  }
}