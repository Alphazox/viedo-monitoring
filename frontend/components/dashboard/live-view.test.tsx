import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveView } from "./live-view";

const { destroyMock, loadSourceMock, attachMediaMock } = vi.hoisted(() => ({
  destroyMock: vi.fn(),
  loadSourceMock: vi.fn(),
  attachMediaMock: vi.fn(),
}));

vi.mock("hls.js", () => {
  class MockHls {
    static isSupported() {
      return true;
    }
    static Events = { ERROR: "hlsError" };
    loadSource = loadSourceMock;
    attachMedia = attachMediaMock;
    destroy = destroyMock;
    on = vi.fn();
  }
  return { default: MockHls };
});

describe("LiveView", () => {
  beforeEach(() => {
    destroyMock.mockClear();
    loadSourceMock.mockClear();
    attachMediaMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("attaches hls.js to the video element with the camera's stream URL", async () => {
    render(<LiveView cameraId="cam-1" />);

    await waitFor(() => expect(loadSourceMock).toHaveBeenCalledWith(expect.stringContaining("/live/cam-1/index.m3u8")));
    expect(attachMediaMock).toHaveBeenCalled();
  });

  it("tears down the hls.js instance on unmount", async () => {
    const { unmount } = render(<LiveView cameraId="cam-1" />);
    await waitFor(() => expect(loadSourceMock).toHaveBeenCalled());

    unmount();

    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it("re-attaches when the camera id changes", async () => {
    const { rerender } = render(<LiveView cameraId="cam-1" />);
    await waitFor(() => expect(loadSourceMock).toHaveBeenCalledWith(expect.stringContaining("cam-1")));

    rerender(<LiveView cameraId="cam-2" />);

    await waitFor(() => expect(loadSourceMock).toHaveBeenCalledWith(expect.stringContaining("cam-2")));
    expect(destroyMock).toHaveBeenCalledTimes(1); // old instance torn down before the new one attaches
  });
});
