interface BrandProps {
  compact?: boolean;
  light?: boolean;
}

function Brand({ compact = false, light = false }: BrandProps) {
  return (
    <div className={`brand ${light ? "brand--light" : ""}`} aria-label="Recall AI">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M9 6.5h12.5A3.5 3.5 0 0 1 25 10v13.5H12.5A3.5 3.5 0 0 1 9 20V6.5Z" />
          <path d="M9 9H7.5A2.5 2.5 0 0 0 5 11.5v11A3.5 3.5 0 0 0 8.5 26H22" />
          <path d="M14 12h6M14 16h6" />
        </svg>
      </span>
      {!compact && (
        <span className="brand__name">
          Recall<span>AI</span>
        </span>
      )}
    </div>
  );
}

export default Brand;
