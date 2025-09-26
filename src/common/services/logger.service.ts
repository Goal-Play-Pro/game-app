import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private readonly auditLogDir: string;
  private readonly auditLogPath: string;
  private readonly maxAuditLogSizeBytes: number;
  private readonly maxAuditLogBackups: number;

  constructor() {
    this.auditLogDir = join(process.cwd(), 'data');
    this.auditLogPath = join(this.auditLogDir, 'audit.log');
    this.maxAuditLogSizeBytes = this.parsePositiveInteger(process.env.AUDIT_LOG_MAX_SIZE_BYTES, 5 * 1024 * 1024);
    this.maxAuditLogBackups = this.parseNonNegativeInteger(process.env.AUDIT_LOG_MAX_BACKUPS, 3);
    this.initializeAuditLog();
  }

  private async initializeAuditLog(): Promise<void> {
    try {
      await fs.mkdir(this.auditLogDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private parsePositiveInteger(value: string | undefined, defaultValue: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return defaultValue;
    }
    return Math.floor(parsed);
  }

  private parseNonNegativeInteger(value: string | undefined, defaultValue: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return defaultValue;
    }
    return Math.floor(parsed);
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
      await this.rotateAuditLogIfNeeded(Buffer.byteLength(logLine, 'utf-8'));
      await fs.appendFile(this.auditLogPath, logLine, 'utf-8');
      console.log(`[AUDIT] ${logLine.trim()}`);
    } catch (error) {
      this.error(`Error escribiendo audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async rotateAuditLogIfNeeded(nextEntrySize: number): Promise<void> {
    if (this.maxAuditLogSizeBytes <= 0) {
      return;
    }

    try {
      const stats = await fs.stat(this.auditLogPath);
      if (stats.size + nextEntrySize <= this.maxAuditLogSizeBytes) {
        return;
      }
    } catch (error) {
      if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // No file to rotate yet
      return;
    }

    await this.rotateAuditFiles();
  }

  private async rotateAuditFiles(): Promise<void> {
    if (this.maxAuditLogBackups <= 0) {
      await fs.rm(this.auditLogPath, { force: true });
      return;
    }

    const oldestBackup = `${this.auditLogPath}.${this.maxAuditLogBackups}`;
    await fs.rm(oldestBackup, { force: true });

    for (let index = this.maxAuditLogBackups - 1; index >= 1; index -= 1) {
      const source = `${this.auditLogPath}.${index}`;
      const target = `${this.auditLogPath}.${index + 1}`;
      await this.safeRename(source, target);
    }

    await this.safeRename(this.auditLogPath, `${this.auditLogPath}.1`);
  }

  private async safeRename(source: string, target: string): Promise<void> {
    try {
      await fs.rename(source, target);
    } catch (error) {
      if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}
