import { join } from 'path';
import { LoggerService } from './logger.service';

jest.mock('fs', () => {
  const files = new Map<string, string>();
  const noop = async () => {};

  const getContent = (path: string) => files.get(path);
  const setContent = (path: string, value: string) => files.set(path, value);

  return {
    promises: {
      mkdir: jest.fn(noop),
      appendFile: jest.fn(async (path: string, data: string) => {
        const current = getContent(path) ?? '';
        setContent(path, current + data);
      }),
      stat: jest.fn(async (path: string) => {
        const content = getContent(path);
        if (content === undefined) {
          const error = new Error('ENOENT');
          (error as NodeJS.ErrnoException).code = 'ENOENT';
          throw error;
        }
        return { size: Buffer.byteLength(content, 'utf-8') } as unknown as { size: number };
      }),
      rename: jest.fn(async (from: string, to: string) => {
        const content = getContent(from);
        if (content === undefined) {
          const error = new Error('ENOENT');
          (error as NodeJS.ErrnoException).code = 'ENOENT';
          throw error;
        }
        setContent(to, content);
        files.delete(from);
      }),
      rm: jest.fn(async (path: string, options?: { force?: boolean }) => {
        if (!files.has(path) && !options?.force) {
          const error = new Error('ENOENT');
          (error as NodeJS.ErrnoException).code = 'ENOENT';
          throw error;
        }
        files.delete(path);
      }),
    },
    __getContent: getContent,
    __setContent: setContent,
    __clear: () => files.clear(),
  };
});

describe('LoggerService audit log rotation', () => {
  const auditPath = join(process.cwd(), 'data', 'audit.log');
  const fsMock = jest.requireMock('fs') as any;

  beforeEach(() => {
    fsMock.__clear();
    process.env.AUDIT_LOG_MAX_SIZE_BYTES = '120';
    process.env.AUDIT_LOG_MAX_BACKUPS = '2';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.AUDIT_LOG_MAX_SIZE_BYTES;
    delete process.env.AUDIT_LOG_MAX_BACKUPS;
    jest.restoreAllMocks();
  });

  it('writes entries without rotation when under threshold', async () => {
    const service = new LoggerService();

    await service.auditLog('auth.login.success', 'user-1', { detail: 'sample' });

    const fileContent = fsMock.__getContent(auditPath);
    expect(fileContent).toContain('auth.login.success');
    expect(fsMock.promises.rename).not.toHaveBeenCalled();
  });

  it('rotates audit log when exceeding threshold', async () => {
    const service = new LoggerService();

    await service.auditLog('event', 'user-1', { data: 'x'.repeat(90) });
    await service.auditLog('event', 'user-1', { data: 'y'.repeat(90) });

    const rotated = fsMock.__getContent(`${auditPath}.1`);
    const current = fsMock.__getContent(auditPath);

    expect(rotated).toBeDefined();
    expect(current).toBeDefined();
    expect(rotated).not.toEqual(current);
  });
});
