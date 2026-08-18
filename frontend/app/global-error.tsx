"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 48, textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong.</h2>
          <p style={{ marginTop: 8, opacity: 0.7 }}>{error.message}</p>
          <button onClick={() => retry()} style={{ marginTop: 16, padding: "8px 16px" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
