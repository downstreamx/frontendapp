interface AuthBackgroundProps {
  primaryColor: string
}

/**
 * Full-bleed SVG scene for auth screens: night logistics map with
 * downstream petroleum silhouettes, depot nodes, and animated product-flow paths.
 */
export function AuthBackground({ primaryColor }: AuthBackgroundProps) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#070d14]">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 72% 18%, ${primaryColor}22 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 18% 78%, ${primaryColor}14 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 100%, #0c1a28 0%, transparent 60%),
            linear-gradient(165deg, #0a121c 0%, #070d14 45%, #0b1520 100%)
          `,
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="authPipe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0" />
            <stop offset="35%" stopColor={primaryColor} stopOpacity="0.55" />
            <stop offset="65%" stopColor={primaryColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="authHorizon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a2d42" stopOpacity="0" />
            <stop offset="100%" stopColor="#132536" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="authMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#24384c" />
            <stop offset="100%" stopColor="#121e2a" />
          </linearGradient>
          <linearGradient id="authTankSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0e1822" />
            <stop offset="35%" stopColor="#1a2c3d" />
            <stop offset="100%" stopColor="#0e1822" />
          </linearGradient>
          <radialGradient id="authNode" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
            <stop offset="45%" stopColor={primaryColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
          <filter id="authSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sparse logistics grid */}
        <g stroke="#1e3348" strokeWidth="1" opacity="0.35">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v-${i}`} x1={120 * (i + 1)} y1="0" x2={120 * (i + 1)} y2="900" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={100 * (i + 1)} x2="1440" y2={100 * (i + 1)} />
          ))}
        </g>

        {/* Ground plane */}
        <path
          d="M-20 620 C180 590, 320 640, 480 620 S780 580, 960 610 S1240 660, 1460 630 L1460 920 L-20 920 Z"
          fill="url(#authHorizon)"
          opacity="0.65"
        />
        <path
          d="M-20 640 C200 615, 360 665, 540 645 S860 595, 1040 630 S1280 680, 1460 650"
          fill="none"
          stroke="#2a455e"
          strokeWidth="1.25"
          opacity="0.7"
        />

        {/* —— Left: depot terminal (horizontal tanks + loading gantry + tanker) —— */}
        <g transform="translate(40, 560)" opacity="0.95">
          {/* Yard pad */}
          <ellipse cx="220" cy="210" rx="230" ry="18" fill="#0a121a" opacity="0.7" />

          {/* Horizontal bullet storage tanks */}
          <g>
            <ellipse cx="28" cy="118" rx="14" ry="28" fill="#152433" />
            <rect x="28" y="90" width="110" height="56" fill="url(#authTankSide)" />
            <ellipse cx="138" cy="118" rx="14" ry="28" fill="#1c3144" />
            <ellipse
              cx="138"
              cy="118"
              rx="14"
              ry="28"
              fill="none"
              stroke={primaryColor}
              strokeOpacity="0.2"
              strokeWidth="1"
            />
            <line x1="50" y1="90" x2="50" y2="146" stroke="#243a50" strokeWidth="1" />
            <line x1="90" y1="90" x2="90" y2="146" stroke="#243a50" strokeWidth="1" />
            <line x1="70" y1="82" x2="70" y2="90" stroke="#2a455e" strokeWidth="2" />
            <circle cx="70" cy="80" r="3" fill={primaryColor} fillOpacity="0.35" />
          </g>
          <g transform="translate(0, 42)">
            <ellipse cx="28" cy="118" rx="14" ry="28" fill="#121c28" />
            <rect x="28" y="90" width="110" height="56" fill="#152433" />
            <ellipse cx="138" cy="118" rx="14" ry="28" fill="#1a2f42" />
            <line x1="50" y1="90" x2="50" y2="146" stroke="#1e364c" strokeWidth="1" />
            <line x1="90" y1="90" x2="90" y2="146" stroke="#1e364c" strokeWidth="1" />
          </g>

          {/* Small vertical day-tank */}
          <g transform="translate(160, 70)">
            <rect x="8" y="40" width="42" height="78" rx="2" fill="#152433" />
            <ellipse cx="29" cy="40" rx="21" ry="9" fill="#1c3348" />
            <ellipse
              cx="29"
              cy="40"
              rx="21"
              ry="9"
              fill="none"
              stroke={primaryColor}
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <rect x="18" y="118" width="22" height="8" fill="#0e1822" />
          </g>

          {/* Loading gantry / rack */}
          <g transform="translate(220, 95)">
            <rect x="0" y="70" width="130" height="6" fill="#1a2d40" />
            <rect x="8" y="20" width="5" height="56" fill="#243a50" />
            <rect x="60" y="20" width="5" height="56" fill="#243a50" />
            <rect x="112" y="20" width="5" height="56" fill="#243a50" />
            <rect x="0" y="18" width="130" height="5" fill="#2a455e" />
            {/* Loading arms */}
            <path
              d="M20 24 C20 50, 35 55, 35 70"
              fill="none"
              stroke="#3a5570"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M72 24 C72 50, 87 55, 87 70"
              fill="none"
              stroke="#3a5570"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M124 24 C124 50, 139 55, 139 70"
              fill="none"
              stroke="#3a5570"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Tanker truck under gantry */}
          <g transform="translate(240, 145)">
            {/* Cab */}
            <rect x="0" y="18" width="36" height="28" rx="3" fill="#1a2f42" />
            <rect x="4" y="22" width="18" height="12" rx="2" fill="#0d1824" />
            <rect x="22" y="8" width="14" height="14" rx="2" fill="#243a50" />
            {/* Trailer tank */}
            <ellipse cx="52" cy="32" rx="10" ry="18" fill="#152433" />
            <rect x="52" y="14" width="88" height="36" fill="url(#authTankSide)" />
            <ellipse cx="140" cy="32" rx="10" ry="18" fill="#1c3144" />
            <line x1="70" y1="14" x2="70" y2="50" stroke="#243a50" strokeWidth="1" />
            <line x1="100" y1="14" x2="100" y2="50" stroke="#243a50" strokeWidth="1" />
            <line x1="125" y1="14" x2="125" y2="50" stroke="#243a50" strokeWidth="1" />
            {/* Wheels */}
            <circle cx="14" cy="50" r="7" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="34" cy="50" r="7" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="78" cy="50" r="7" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="98" cy="50" r="7" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="128" cy="50" r="7" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
          </g>

          {/* Ground pipeline stubs */}
          <path
            d="M150 188 H210 M210 188 V170"
            fill="none"
            stroke="#2a455e"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* —— Center-right mid: pump island hint —— */}
        <g transform="translate(620, 680)" opacity="0.55">
          <rect x="0" y="20" width="120" height="8" rx="2" fill="#1a2d40" />
          <rect x="20" y="0" width="18" height="28" rx="2" fill="#152433" />
          <rect x="82" y="0" width="18" height="28" rx="2" fill="#152433" />
          <rect x="24" y="4" width="10" height="8" rx="1" fill={primaryColor} fillOpacity="0.25" />
          <rect x="86" y="4" width="10" height="8" rx="1" fill={primaryColor} fillOpacity="0.25" />
        </g>

        {/* —— Right: terminal / LPG sphere + stack + second tanker —— */}
        <g transform="translate(1020, 520)" opacity="0.92">
          <ellipse cx="200" cy="250" rx="210" ry="16" fill="#0a121a" opacity="0.65" />

          {/* Distillation / process tower */}
          <g transform="translate(20, 20)">
            <rect x="18" y="40" width="36" height="160" rx="2" fill="url(#authMetal)" />
            <rect x="14" y="36" width="44" height="10" rx="1" fill="#1c3144" />
            <rect x="14" y="80" width="44" height="6" fill="#1a2d40" />
            <rect x="14" y="120" width="44" height="6" fill="#1a2d40" />
            <rect x="14" y="160" width="44" height="6" fill="#1a2d40" />
            {/* Stack / flare tip */}
            <rect x="28" y="0" width="16" height="36" fill="#121c28" />
            <circle cx="36" cy="-2" r="5" fill={primaryColor} fillOpacity="0.45" className="auth-node-pulse" />
            {/* Side pipework */}
            <path
              d="M54 70 H78 V110 H54"
              fill="none"
              stroke="#2a455e"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <rect x="78" y="100" width="22" height="28" rx="2" fill="#152433" />
          </g>

          {/* LPG / pressure sphere */}
          <g transform="translate(120, 100)">
            <circle cx="55" cy="70" r="52" fill="#152433" />
            <circle
              cx="55"
              cy="70"
              r="52"
              fill="none"
              stroke={primaryColor}
              strokeOpacity="0.18"
              strokeWidth="1.5"
            />
            <ellipse cx="40" cy="55" rx="14" ry="20" fill="#1c3144" opacity="0.45" />
            <rect x="50" y="118" width="10" height="18" fill="#0e1822" />
            <rect x="30" y="134" width="50" height="6" fill="#121c28" />
            <line x1="55" y1="18" x2="55" y2="8" stroke="#2a455e" strokeWidth="2" />
            <circle cx="55" cy="6" r="3" fill={primaryColor} fillOpacity="0.4" />
          </g>

          {/* Horizontal product tank behind sphere */}
          <g transform="translate(230, 130)">
            <ellipse cx="12" cy="40" rx="12" ry="24" fill="#121c28" />
            <rect x="12" y="16" width="90" height="48" fill="#152433" />
            <ellipse cx="102" cy="40" rx="12" ry="24" fill="#1a2f42" />
            <line x1="35" y1="16" x2="35" y2="64" stroke="#1e364c" strokeWidth="1" />
            <line x1="65" y1="16" x2="65" y2="64" stroke="#1e364c" strokeWidth="1" />
          </g>

          {/* Second tanker leaving terminal */}
          <g transform="translate(200, 200)">
            <rect x="100" y="18" width="34" height="26" rx="3" fill="#1a2f42" />
            <rect x="104" y="22" width="16" height="10" rx="1" fill="#0d1824" />
            <ellipse cx="8" cy="30" rx="8" ry="16" fill="#152433" />
            <rect x="8" y="14" width="90" height="32" fill="url(#authTankSide)" />
            <ellipse cx="98" cy="30" rx="8" ry="16" fill="#1c3144" />
            <circle cx="118" cy="48" r="6" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="130" cy="48" r="6" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="30" cy="48" r="6" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="50" cy="48" r="6" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
            <circle cx="78" cy="48" r="6" fill="#0a121a" stroke="#2a455e" strokeWidth="1.5" />
          </g>
        </g>

        {/* Product-flow corridors */}
        <g fill="none" stroke="url(#authPipe)" strokeWidth="1.75" strokeLinecap="round">
          <path
            className="auth-flow-a"
            d="M160 640 C320 600, 420 480, 560 420 S820 360, 980 400 S1180 520, 1280 580"
            strokeDasharray="6 14"
          />
          <path
            className="auth-flow-b"
            d="M220 700 C400 680, 520 620, 680 560 S980 480, 1120 520"
            strokeDasharray="4 12"
            opacity="0.7"
          />
          <path
            className="auth-flow-c"
            d="M100 500 C280 440, 450 380, 640 360 S980 340, 1200 300"
            strokeDasharray="5 16"
            opacity="0.55"
          />
        </g>

        {/* Static corridor underlays */}
        <g fill="none" stroke="#243a50" strokeWidth="1" opacity="0.45">
          <path d="M160 640 C320 600, 420 480, 560 420 S820 360, 980 400 S1180 520, 1280 580" />
          <path d="M220 700 C400 680, 520 620, 680 560 S980 480, 1120 520" />
          <path d="M100 500 C280 440, 450 380, 640 360 S980 340, 1200 300" />
        </g>

        {/* Depot / terminal nodes */}
        <g filter="url(#authSoftGlow)">
          {[
            [160, 640],
            [560, 420],
            [980, 400],
            [1280, 580],
            [680, 560],
            [640, 360],
            [1200, 300],
            [1120, 520],
          ].map(([x, y], i) => (
            <g key={`n-${i}`} className={i % 2 === 0 ? 'auth-node-pulse' : 'auth-node-pulse-delayed'}>
              <circle cx={x} cy={y} r="18" fill="url(#authNode)" />
              <circle cx={x} cy={y} r="3.5" fill={primaryColor} />
              <circle cx={x} cy={y} r="7" fill="none" stroke={primaryColor} strokeOpacity="0.45" strokeWidth="1" />
            </g>
          ))}
        </g>

        {/* Route ticks */}
        <g stroke={primaryColor} strokeOpacity="0.35" strokeWidth="1.5">
          <path d="M420 470 l8 -10 M560 420 l8 -10 M720 380 l8 -10 M880 385 l8 -10 M1060 450 l8 -10" />
        </g>
      </svg>

      {/* Soft vignette so the card stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,13,20,0.35)_55%,rgba(7,13,20,0.72)_100%)]" />

      <style>{`
        @keyframes auth-flow {
          to { stroke-dashoffset: -120; }
        }
        @keyframes auth-node {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .auth-flow-a {
          animation: auth-flow 18s linear infinite;
        }
        .auth-flow-b {
          animation: auth-flow 24s linear infinite reverse;
        }
        .auth-flow-c {
          animation: auth-flow 28s linear infinite;
        }
        .auth-node-pulse,
        .auth-node-pulse-delayed {
          transform-origin: center;
          transform-box: fill-box;
          animation: auth-node 4.5s ease-in-out infinite;
        }
        .auth-node-pulse-delayed {
          animation-delay: 1.6s;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-flow-a,
          .auth-flow-b,
          .auth-flow-c,
          .auth-node-pulse,
          .auth-node-pulse-delayed {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
