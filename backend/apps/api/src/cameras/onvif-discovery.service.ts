import { Injectable, Logger } from '@nestjs/common';

// The `onvif` package ships no TypeScript declarations; treated as `any` at
// this one boundary rather than adding a speculative ambient .d.ts.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const onvif = require('onvif');

const DISCOVERY_TIMEOUT_MS = 5_000;

export interface DiscoveredDevice {
  address: string;
  manufacturer?: string;
  model?: string;
}

interface DiscoveredCam {
  hostname?: string;
  name?: string;
  hardware?: string;
}

/**
 * WS-Discovery (UDP multicast) sweep of the API host's network. Returns
 * candidates without persisting anything — the caller then POSTs
 * /v1/cameras with sourceType ONVIF and the chosen device's address, which
 * is when CamerasService opens a real device-management connection to pull
 * capability/profile info.
 *
 * Verification risk flag (LLD §5, unresolved): WS-Discovery relies on UDP
 * multicast, which may not traverse the api container's Docker bridge
 * network cleanly. Needs to be proven against a real/simulated ONVIF device
 * during implementation; if it doesn't, the fallback is host networking for
 * this call path, or a manual "enter IP:port" unicast flow. The
 * `name`/`hardware` fields below are populated only when the discovering
 * device's WS-Discovery Scopes response happens to include them — that
 * varies by camera vendor and is also unverified against real hardware.
 */
@Injectable()
export class OnvifDiscoveryService {
  private readonly logger = new Logger(OnvifDiscoveryService.name);

  async discover(): Promise<DiscoveredDevice[]> {
    return new Promise((resolve) => {
      onvif.Discovery.probe(
        { timeout: DISCOVERY_TIMEOUT_MS },
        (error: Error | null, cams: DiscoveredCam[] | undefined) => {
          if (error) {
            this.logger.warn(`ONVIF discovery probe failed: ${error.message}`);
            resolve([]);
            return;
          }

          resolve(
            (cams ?? [])
              .filter((cam) => Boolean(cam.hostname))
              .map((cam) => ({
                address: cam.hostname as string,
                manufacturer: cam.hardware,
                model: cam.name,
              })),
          );
        },
      );
    });
  }
}
