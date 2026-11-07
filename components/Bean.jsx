/** Icône grain de café (SVG) */
export default function Bean({ className, ...props }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <g transform="rotate(-30 12 12)">
        <ellipse cx="12" cy="12" rx="6.4" ry="9.2" fill="currentColor" />
        <path d="M12 3.2 C 8.6 8.6, 15.4 15.4, 12 20.8" stroke="var(--bg, #120a06)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
