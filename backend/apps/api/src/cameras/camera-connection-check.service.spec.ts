import { promisify } from 'util';
import type { CameraConnectionCheckService as CameraConnectionCheckServiceType } from './camera-connection-check.service';

/**
 * `CameraConnectionCheckService` builds `execFileAsync = promisify(execFile)`
 * once, at module-load time. A `jest.mock('child_process')` + `beforeEach`
 * mock reconfiguration (the usual pattern) would set up the mock too late —
 * the module has already captured whatever `execFile[promisify.custom]` was
 * (or wasn't) at import time. `jest.isolateModules` gives each test a fresh
 * module registry so the mock — including its promisify.custom, which is
 * what `promisify()` actually looks for — is in place *before* the service
 * module is required and evaluates that line.
 */
function loadServiceWithMockedFfprobe(
  execFileImpl: (command: string, args: string[]) => Promise<{ stdout: string; stderr: string }>,
): { service: CameraConnectionCheckServiceType; capturedArgs: () => string[] | undefined } {
  let service!: CameraConnectionCheckServiceType;
  let capturedArgs: string[] | undefined;

  jest.isolateModules(() => {
    jest.doMock('child_process', () => {
      const execFile: any = jest.fn();
      execFile[promisify.custom] = jest.fn(async (command: string, args: string[]) => {
        capturedArgs = args;
        return execFileImpl(command, args);
      });
      return { execFile };
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CameraConnectionCheckService } = require('./camera-connection-check.service');
    service = new CameraConnectionCheckService();
  });

  return { service, capturedArgs: () => capturedArgs };
}

describe('CameraConnectionCheckService', () => {
  it('invokes ffprobe with the URL as a single argv element, never a shell string', async () => {
    const { service, capturedArgs } = loadServiceWithMockedFfprobe(async () => ({
      stdout: JSON.stringify({ streams: [{ codec_type: 'video' }] }),
      stderr: '',
    }));

    await service.check('rtsp://host/stream; rm -rf /');

    const args = capturedArgs();
    expect(Array.isArray(args)).toBe(true);
    // The malicious segment must appear as one untouched argv element —
    // never concatenated into a shell command string that could execute it.
    expect(args).toContain('rtsp://host/stream; rm -rf /');
  });

  it('succeeds when ffprobe reports a video stream', async () => {
    const { service } = loadServiceWithMockedFfprobe(async () => ({
      stdout: JSON.stringify({ streams: [{ codec_type: 'audio' }, { codec_type: 'video' }] }),
      stderr: '',
    }));

    const result = await service.check('rtsp://host/stream');
    expect(result).toEqual({ success: true });
  });

  it('fails when ffprobe reports no video stream', async () => {
    const { service } = loadServiceWithMockedFfprobe(async () => ({
      stdout: JSON.stringify({ streams: [{ codec_type: 'audio' }] }),
      stderr: '',
    }));

    const result = await service.check('rtsp://host/stream');
    expect(result.success).toBe(false);
    expect(result.error).toBe('No video stream found');
  });

  it('fails and captures stderr when ffprobe errors out', async () => {
    const { service } = loadServiceWithMockedFfprobe(async () => {
      throw Object.assign(new Error('exit code 1'), { stderr: 'Connection refused' });
    });

    const result = await service.check('rtsp://host/stream');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
  });
});
