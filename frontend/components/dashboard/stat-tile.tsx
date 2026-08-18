const TONE_VARS: Record<string, string> = {
  amber: "var(--amber)",
  crimson: "var(--crimson)",
  teal: "var(--teal)",
  violet: "var(--violet)",
  blue: "var(--blue)",
};

export function StatTile({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: keyof typeof TONE_VARS;
}) {
  const color = TONE_VARS[tone];
  return (
    <div className="stat-tile">
      <div className="stat-tile-icon" style={{ color, background: `color-mix(in srgb, ${color} 14%, var(--panel-2))` }}>
        {icon}
      </div>
      <div>
        <div className="stat-tile-value">{value}</div>
        <div className="stat-tile-label">{label}</div>
      </div>
    </div>
  );
}
