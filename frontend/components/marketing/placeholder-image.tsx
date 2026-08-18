interface PlaceholderImageProps {
  label: string;
  className?: string;
  variant?: "photo" | "video";
}

export function PlaceholderImage({ label, className, variant = "photo" }: PlaceholderImageProps) {
  return (
    <div className={`ph${className ? ` ${className}` : ""}`}>
      <div className="ph-label">
        <span className="ph-icon" aria-hidden="true">
          {variant === "video" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block" }}>
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block" }}>
              <path
                d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </span>
        {label}
      </div>
    </div>
  );
}
