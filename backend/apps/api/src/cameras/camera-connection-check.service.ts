import { execFile } from 'child_process';
import { promisify } from 'util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const execFileAsync = promisify(execFile);

const FFPROBE_TIMEOUT_MICROS = 5_000_000; // ffprobe-side soft bound (5s)
const EXEC_TIMEOUT_MS = 8_000; // execFile-side hard kill — defense in depth, not redundant
const STDERR_TRUNCATE_LENGTH = 500;

export interface ConnectionCheckResult {
  success: boolean;
  error?: string;
}

/**
 * Bounded, synchronous point-in-time reachability probe via ffprobe. Not a
 * stream reader — Phase 5's ingestion pipeline supersedes this with real,
 * continuous frame telemetry.
 */
@Injectable()
export class CameraConnectionCheckService {
  constructor(private readonly config: ConfigService) {}

  /** `url` must already have any credentials injected — never logged here. */
  async check(url: string): Promise<ConnectionCheckResult> {
    try {
      // execFile with an argv array, never exec with an interpolated string —
      // url is user-supplied input and string-interpolating it into a shell
      // command would be a command-injection vector.
      const { stdout } = await execFileAsync(
        this.config.get<string>('FFPROBE_PATH', 'ffprobe'),
        [
          '-v',
          'error',
          '-rtsp_transport',
          'tcp',
          '-timeout',
          String(FFPROBE_TIMEOUT_MICROS),
          '-i',
          url,
          '-show_entries',
          'stream=codec_type',
          '-of',
          'json',
        ],
        { timeout: EXEC_TIMEOUT_MS, killSignal: 'SIGKILL' },
      );

      const parsed = JSON.parse(stdout) as { streams?: Array<{ codec_type?: string }> };
      const hasVideoStream =
        parsed.streams?.some((stream) => stream.codec_type === 'video') ?? false;

      return hasVideoStream
        ? { success: true }
        : { success: false, error: 'No video stream found' };
    } catch (error) {
      return { success: false, error: this.describeError(error) };
    }
  }

  private describeError(error: unknown): string {
    const stderr = (error as { stderr?: string } | undefined)?.stderr;
    const message = stderr || (error instanceof Error ? error.message : String(error));
    return message.slice(0, STDERR_TRUNCATE_LENGTH);
  }
}
