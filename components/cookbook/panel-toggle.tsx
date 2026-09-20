type PanelToggleProps = {
  side: "left" | "right";
  expanded: boolean;
  label: string;
  onClick: () => void;
  className?: string;
};

export function PanelToggle({ side, expanded, label, onClick, className = "" }: PanelToggleProps) {
  const pointsRight = side === "left" ? !expanded : expanded;
  return (
    <button
      type="button"
      className={`cw-icon cw-panel-toggle ${className}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
    >
      <span className={`cw-chevron ${pointsRight ? "cw-chevron-right" : ""}`} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14 6-6 6 6 6" />
        </svg>
      </span>
    </button>
  );
}
