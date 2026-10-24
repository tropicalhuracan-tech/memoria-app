export function SafeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="safeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#52525b" />
          <stop offset="50%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
        <linearGradient id="safeDoor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
      </defs>
      <rect x="24" y="20" width="152" height="180" rx="12" fill="url(#safeMetal)" />
      <rect x="32" y="28" width="136" height="164" rx="8" fill="#18181b" />
      <rect x="48" y="48" width="104" height="120" rx="6" fill="url(#safeDoor)" stroke="#a1a1aa" strokeWidth="2" />
      <circle cx="100" cy="108" r="36" fill="#09090b" stroke="#fbbf24" strokeWidth="4" />
      <circle cx="100" cy="108" r="28" fill="#27272a" stroke="#71717a" strokeWidth="2" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="108"
          x2={100 + 22 * Math.cos((deg * Math.PI) / 180)}
          y2={108 + 22 * Math.sin((deg * Math.PI) / 180)}
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
      <circle cx="100" cy="108" r="6" fill="#fbbf24" />
      <rect x="88" y="168" width="24" height="8" rx="2" fill="#fbbf24" opacity="0.8" />
    </svg>
  );
}
