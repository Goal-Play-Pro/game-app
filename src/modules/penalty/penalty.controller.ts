import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PenaltyService } from './penalty.service';
import { 
  CreateSessionDto, 
  JoinSessionDto, 
  PenaltyAttemptDto, 
  PenaltySessionDto,
  AttemptResultDto 
} from './dto/penalty.dto';

@ApiTags('penalty')
@Controller('penalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PenaltyController {
  constructor(private readonly penaltyService: PenaltyService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get user penalty sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved', type: [PenaltySessionDto] })
  async getUserSessions(@Request() req: any): Promise<PenaltySessionDto[]> {
    return this.penaltyService.findUserSessions(req.user.userId);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create penalty session' })
  @ApiResponse({ status: 201, description: 'Session created', type: PenaltySessionDto })
  async createSession(@Request() req: any, @Body() dto: CreateSessionDto): Promise<PenaltySessionDto> {
    return this.penaltyService.createSession(req.user.userId, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get penalty session details' })
  @ApiResponse({ status: 200, description: 'Session retrieved', type: PenaltySessionDto })
  async getSession(@Param('id') id: string): Promise<PenaltySessionDto> {
    return this.penaltyService.findSessionById(id);
  }

  @Post('sessions/:id/join')
  @ApiOperation({ summary: 'Join PvP penalty session' })
  @ApiResponse({ status: 200, description: 'Session joined', type: PenaltySessionDto })
  async joinSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: JoinSessionDto,
  ): Promise<PenaltySessionDto> {
    return this.penaltyService.joinSession(id, req.user.userId, dto);
  }

  @Post('sessions/:id/attempts')
  @ApiOperation({ summary: 'Attempt penalty kick' })
  @ApiResponse({ status: 200, description: 'Attempt executed', type: AttemptResultDto })
  async attemptPenalty(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: PenaltyAttemptDto,
  ): Promise<AttemptResultDto> {
    const result = await this.penaltyService.attemptPenalty(id, req.user.userId, dto);
    
    return {
      isGoal: result.isGoal,
      description: result.description,
      round: result.session.currentRound - 1,
      hostScore: result.session.hostScore,
      guestScore: result.session.guestScore,
      sessionStatus: result.session.status,
      winnerId: result.session.winnerId,
    };
  }

  @Get('sessions/:id/attempts')
  @ApiOperation({ summary: 'Get session attempts history' })
  @ApiResponse({ status: 200, description: 'Attempts retrieved' })
  async getSessionAttempts(@Param('id') id: string) {
    return this.penaltyService.getSessionAttempts(id);
  }
}