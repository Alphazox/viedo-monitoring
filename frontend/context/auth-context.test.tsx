import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";

const { refreshSessionMock, setOnUnauthorizedMock } = vi.hoisted(() => ({
  refreshSessionMock: vi.fn(),
  setOnUnauthorizedMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  refreshSession: refreshSessionMock,
  setOnUnauthorized: setOnUnauthorizedMock,
}));

const loginMock = vi.fn();
const logoutMock = vi.fn();
const meMock = vi.fn();

vi.mock("@/lib/api/resources", () => ({
  authApi: {
    login: (...args: unknown[]) => loginMock(...args),
    logout: (...args: unknown[]) => logoutMock(...args),
    me: (...args: unknown[]) => meMock(...args),
  },
}));

function Probe() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <button onClick={() => login("admin@example.com", "password")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    refreshSessionMock.mockReset();
    loginMock.mockReset();
    logoutMock.mockReset();
    meMock.mockReset();
  });

  it("starts unauthenticated when there is no valid session cookie", async () => {
    refreshSessionMock.mockResolvedValue(false);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("restores the session when the refresh cookie is still valid", async () => {
    refreshSessionMock.mockResolvedValue(true);
    meMock.mockResolvedValue({ email: "admin@example.com" });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("admin@example.com"));
  });

  it("login sets the user from authApi.login's response", async () => {
    refreshSessionMock.mockResolvedValue(false);
    loginMock.mockResolvedValue({ email: "new-user@example.com" });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await act(async () => {
      screen.getByText("login").click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("new-user@example.com");
  });

  it("logout clears the user even if the server call fails", async () => {
    refreshSessionMock.mockResolvedValue(true);
    meMock.mockResolvedValue({ email: "admin@example.com" });
    logoutMock.mockRejectedValue(new Error("network down"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("admin@example.com"));

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });
});
