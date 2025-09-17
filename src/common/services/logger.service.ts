import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private auditLogPath: string;

  constructor() {
    this.auditLogPath = join(process.cwd(), 'data', 'audit.log');
    this.initializeAuditLog();
  }

  private async initializeAuditLog(): Promise<void> {
    try {
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }
  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const logContext = context || this.context;
    console.log(`[${new Date().toISOString()}] [LOG] [${logContext}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    const logContext = context || this.context;
    console.error(`[${new Date().toISOString()}] [ERROR] [${logContext}] ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    const logContext = context || this.context;
    console.warn(`[${new Date().toISOString()}] [WARN] [${logContext}] ${message}`);
  }

  debug(message: any, context?: string) {
    const logContext = context || this.context;
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${logContext}] ${message}`);
  }

  verbose(message: any, context?: string) {
    const logContext = context || this.context;
    console.log(`[${new Date().toISOString()}] [VERBOSE] [${logContext}] ${message}`);
  }

  async auditLog(action: string, userId: string, details: any): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
    };

    try {
      const logLine = JSON.stringify(auditEntry) + '\n';
      await fs.appendFile(this.auditLogPath, logLine, 'utf-8');
    } catch (error) {
      this.error(`Error escribiendo audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}