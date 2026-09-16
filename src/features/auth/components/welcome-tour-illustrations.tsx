type IllustrationProps = {
  className?: string
}

const frameClass = 'h-full w-full'

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 ${className ?? ''}`}
    >
      <svg
        viewBox="0 0 480 220"
        preserveAspectRatio="xMidYMid meet"
        className={frameClass}
        aria-hidden
      >
        {children}
      </svg>
    </div>
  )
}

export function WelcomeIllustrationWelcome({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#f8fafc" />
      <rect x="48" y="48" width="200" height="130" rx="12" fill="#fff" stroke="#cbd5e1" />
      <rect x="68" y="68" width="90" height="10" rx="5" fill="#10b77f" opacity="0.85" />
      <rect x="68" y="90" width="140" height="8" rx="4" fill="#e2e8f0" />
      <rect x="68" y="110" width="120" height="8" rx="4" fill="#e2e8f0" />
      <rect x="68" y="130" width="100" height="8" rx="4" fill="#e2e8f0" />
      <circle cx="340" cy="100" r="54" fill="#10b77f" opacity="0.12" />
      <circle cx="340" cy="100" r="34" fill="#10b77f" opacity="0.25" />
      <path
        d="M320 100h40M340 80v40"
        stroke="#0f766e"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="280" y="150" width="120" height="28" rx="8" fill="#10b77f" />
    </Frame>
  )
}

export function WelcomeIllustrationRoles({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#f8fafc" />
      {[
        [120, 120],
        [240, 90],
        [360, 120],
        [180, 160],
        [300, 160],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="28" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
          <circle cx={cx} cy={cy - 6} r="9" fill="#10b77f" />
          <path
            d={`M${cx - 14} ${cy + 14}c4-10 24-10 28 0`}
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
      <circle cx="240" cy="90" r="32" fill="none" stroke="#10b77f" strokeWidth="3" />
    </Frame>
  )
}

export function WelcomeIllustrationProducts({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#f8fafc" />
      <ellipse cx="130" cy="175" rx="55" ry="12" fill="#cbd5e1" />
      <rect x="85" y="70" width="90" height="105" rx="8" fill="#1e293b" />
      <ellipse cx="130" cy="70" rx="45" ry="16" fill="#334155" />
      <ellipse cx="130" cy="70" rx="45" ry="16" fill="none" stroke="#10b77f" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1="95"
          y1={95 + i * 22}
          x2="165"
          y2={95 + i * 22}
          stroke="#475569"
          strokeWidth="2"
        />
      ))}
      <rect x="220" y="100" width="180" height="70" rx="10" fill="#fff" stroke="#cbd5e1" />
      {['PMS', 'AGO', 'DPK', 'LPG'].map((label, i) => (
        <g key={label}>
          <rect x={236 + i * 40} y="118" width="32" height="36" rx="6" fill="#ecfdf5" stroke="#10b77f" />
          <text
            x={252 + i * 40}
            y="141"
            textAnchor="middle"
            fontSize="9"
            fill="#0f766e"
            fontFamily="system-ui,sans-serif"
          >
            {label}
          </text>
        </g>
      ))}
    </Frame>
  )
}

export function WelcomeIllustrationAccounting({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#f8fafc" />
      <rect x="70" y="40" width="160" height="150" rx="10" fill="#fff" stroke="#cbd5e1" />
      <rect x="90" y="60" width="120" height="10" rx="5" fill="#10b77f" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="90" y={90 + i * 18} width={100 - i * 8} height="8" rx="4" fill="#e2e8f0" />
      ))}
      <path
        d="M280 160 L320 120 L360 135 L410 70"
        fill="none"
        stroke="#10b77f"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="320" cy="120" r="6" fill="#0f766e" />
      <circle cx="360" cy="135" r="6" fill="#0f766e" />
      <circle cx="410" cy="70" r="6" fill="#0f766e" />
      <rect x="280" y="160" width="140" height="24" rx="8" fill="#ecfdf5" />
    </Frame>
  )
}

export function WelcomeIllustrationPeople({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#f8fafc" />
      <rect x="60" y="70" width="140" height="100" rx="10" fill="#fff" stroke="#cbd5e1" />
      <rect x="80" y="90" width="50" height="50" rx="8" fill="#ecfdf5" />
      <rect x="140" y="95" width="40" height="8" rx="4" fill="#94a3b8" />
      <rect x="140" y="115" width="30" height="8" rx="4" fill="#cbd5e1" />
      <rect x="240" y="110" width="170" height="55" rx="12" fill="#1e293b" />
      <circle cx="270" cy="138" r="16" fill="#475569" />
      <circle cx="380" cy="138" r="16" fill="#475569" />
      <rect x="290" y="120" width="60" height="20" rx="4" fill="#10b77f" />
      <path d="M220 138 H240" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  )
}

export function WelcomeIllustrationTour({ className }: IllustrationProps) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="480" height="220" fill="#0f172a" />
      <rect x="90" y="40" width="300" height="140" rx="14" fill="#1e293b" />
      <circle cx="240" cy="110" r="36" fill="#10b77f" />
      <path d="M230 92 L262 110 L230 128 Z" fill="#fff" />
      <rect x="120" y="160" width="240" height="8" rx="4" fill="#334155" />
    </Frame>
  )
}

export type WelcomeIllustrationKey =
  | 'welcome'
  | 'roles'
  | 'products'
  | 'accounting'
  | 'people'
  | 'tour'

export function WelcomeTourIllustration({
  kind,
  className,
}: {
  kind: WelcomeIllustrationKey
  className?: string
}) {
  switch (kind) {
    case 'welcome':
      return <WelcomeIllustrationWelcome className={className} />
    case 'roles':
      return <WelcomeIllustrationRoles className={className} />
    case 'products':
      return <WelcomeIllustrationProducts className={className} />
    case 'accounting':
      return <WelcomeIllustrationAccounting className={className} />
    case 'people':
      return <WelcomeIllustrationPeople className={className} />
    case 'tour':
      return <WelcomeIllustrationTour className={className} />
  }
}
