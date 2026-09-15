interface AuthBackgroundProps {
  primaryColor: string
}

/**
 * Full-bleed SVG scene for auth screens: night logistics map above a
 * vibrant downstream skyline — fuel station, tank farm, and glowing refinery.
 */
export function AuthBackground({ primaryColor }: AuthBackgroundProps) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#070d14]">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 72% 18%, ${primaryColor}22 0%, transparent 55%),
            radial-gradient(ellipse 55% 40% at 22% 88%, #ff8a2b28 0%, transparent 55%),
            radial-gradient(ellipse 50% 38% at 78% 82%, #ffb34733 0%, transparent 50%),
            radial-gradient(ellipse 70% 45% at 50% 92%, ${primaryColor}18 0%, transparent 55%),
            linear-gradient(165deg, #0a121c 0%, #070d14 42%, #0c1824 100%)
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
            <stop offset="0%" stopColor="#1a3048" stopOpacity="0" />
            <stop offset="55%" stopColor="#152a3c" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0e1c2a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="authGroundGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff9a3c" stopOpacity="0" />
            <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="authMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a556e" />
            <stop offset="45%" stopColor="#24384c" />
            <stop offset="100%" stopColor="#121e2a" />
          </linearGradient>
          <linearGradient id="authMetalBright" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5a7a96" />
            <stop offset="40%" stopColor="#2f4a62" />
            <stop offset="100%" stopColor="#162636" />
          </linearGradient>
          <linearGradient id="authTankSide" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#152433" />
            <stop offset="35%" stopColor="#2a455e" />
            <stop offset="70%" stopColor="#1c3348" />
            <stop offset="100%" stopColor="#0e1822" />
          </linearGradient>
          <linearGradient id="authCanopy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a8f6a" />
            <stop offset="55%" stopColor={primaryColor} />
            <stop offset="100%" stopColor="#0d4a36" />
          </linearGradient>
          <linearGradient id="authCanopyEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffe08a" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#fff3c4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffe08a" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="authFlare" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff4d00" />
            <stop offset="40%" stopColor="#ff8c1a" />
            <stop offset="75%" stopColor="#ffd24a" />
            <stop offset="100%" stopColor="#fff6c8" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="authFlareGlow" cx="50%" cy="70%" r="55%">
            <stop offset="0%" stopColor="#ffb347" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#ff6b1a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff4d00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="authStationGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff4c8" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#ffd56a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffd56a" stopOpacity="0" />
          </radialGradient>
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
          <filter id="authWarmBloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sparse logistics grid */}
        <g stroke="#1e3348" strokeWidth="1" opacity="0.32">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v-${i}`} x1={120 * (i + 1)} y1="0" x2={120 * (i + 1)} y2="900" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={100 * (i + 1)} x2="1440" y2={100 * (i + 1)} />
          ))}
        </g>

        {/* Ground plane + warm industrial wash */}
        <path
          d="M-20 600 C180 575, 340 630, 520 605 S820 560, 1000 595 S1260 650, 1460 620 L1460 920 L-20 920 Z"
          fill="url(#authHorizon)"
          opacity="0.9"
        />
        <path
          d="M-20 680 C220 655, 420 710, 640 685 S980 640, 1180 690 S1340 720, 1460 700 L1460 920 L-20 920 Z"
          fill="url(#authGroundGlow)"
          opacity="0.85"
        />
        <path
          d="M-20 625 C200 600, 360 650, 540 630 S860 580, 1040 615 S1280 665, 1460 635"
          fill="none"
          stroke="#3a6080"
          strokeWidth="1.5"
          opacity="0.55"
        />

        {/* —— Left: tank farm / terminal —— */}
        <g transform="translate(20, 545)" opacity="0.98">
          <ellipse cx="210" cy="230" rx="240" ry="20" fill="#061018" opacity="0.75" />

          {/* Vertical white product tanks */}
          {[0, 58, 116].map((dx, i) => (
            <g key={`vt-${i}`} transform={`translate(${dx}, ${30 + (i % 2) * 8})`}>
              <rect x="10" y="48" width="44" height="118" rx="3" fill="url(#authMetalBright)" />
              <ellipse cx="32" cy="48" rx="22" ry="10" fill="#6a8aa6" />
              <ellipse
                cx="32"
                cy="48"
                rx="22"
                ry="10"
                fill="none"
                stroke={primaryColor}
                strokeOpacity="0.35"
                strokeWidth="1.25"
              />
              <rect x="18" y="70" width="28" height="4" rx="1" fill="#8eb0cc" opacity="0.55" />
              <rect x="18" y="100" width="28" height="4" rx="1" fill="#8eb0cc" opacity="0.4" />
              <rect x="18" y="130" width="28" height="4" rx="1" fill="#8eb0cc" opacity="0.3" />
              <rect x="22" y="166" width="20" height="10" fill="#0e1822" />
              <circle cx="32" cy="40" r="3" fill={primaryColor} fillOpacity="0.55" className="auth-node-pulse" />
            </g>
          ))}

          {/* Horizontal bullet tanks */}
          <g transform="translate(190, 95)">
            <ellipse cx="20" cy="50" rx="14" ry="30" fill="#1a3144" />
            <rect x="20" y="20" width="130" height="60" fill="url(#authTankSide)" />
            <ellipse cx="150" cy="50" rx="14" ry="30" fill="#2e4d68" />
            <ellipse
              cx="150"
              cy="50"
              rx="14"
              ry="30"
              fill="none"
              stroke="#7ec8ff"
              strokeOpacity="0.35"
              strokeWidth="1.25"
            />
            <line x1="50" y1="20" x2="50" y2="80" stroke="#3a6080" strokeWidth="1.25" />
            <line x1="90" y1="20" x2="90" y2="80" stroke="#3a6080" strokeWidth="1.25" />
            <line x1="125" y1="20" x2="125" y2="80" stroke="#3a6080" strokeWidth="1.25" />
            <circle cx="85" cy="16" r="4" fill="#ffb347" fillOpacity="0.7" className="auth-node-pulse-delayed" />
          </g>
          <g transform="translate(210, 145)">
            <ellipse cx="16" cy="40" rx="12" ry="24" fill="#152433" />
            <rect x="16" y="16" width="110" height="48" fill="#1c3348" />
            <ellipse cx="126" cy="40" rx="12" ry="24" fill="#274860" />
            <line x1="45" y1="16" x2="45" y2="64" stroke="#2a455e" strokeWidth="1" />
            <line x1="80" y1="16" x2="80" y2="64" stroke="#2a455e" strokeWidth="1" />
          </g>

          {/* Loading gantry + tanker */}
          <g transform="translate(360, 100)">
            <rect x="0" y="78" width="150" height="7" fill="#2a455e" />
            <rect x="10" y="24" width="6" height="60" fill="#4a6a86" />
            <rect x="70" y="24" width="6" height="60" fill="#4a6a86" />
            <rect x="130" y="24" width="6" height="60" fill="#4a6a86" />
            <rect x="0" y="20" width="150" height="7" fill="#6a8aa6" />
            <path
              d="M28 28 C28 55, 42 62, 42 78"
              fill="none"
              stroke="#ffb347"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M88 28 C88 55, 102 62, 102 78"
              fill="none"
              stroke="#ffb347"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          </g>
          <g transform="translate(375, 155)">
            <rect x="0" y="18" width="38" height="30" rx="3" fill="#1e3a52" />
            <rect x="5" y="22" width="18" height="12" rx="2" fill="#0a1824" />
            <rect x="24" y="8" width="14" height="14" rx="2" fill="#3a6080" />
            <ellipse cx="54" cy="34" rx="10" ry="18" fill="#1a3144" />
            <rect x="54" y="16" width="95" height="36" fill="url(#authTankSide)" />
            <ellipse cx="149" cy="34" rx="10" ry="18" fill="#2e4d68" />
            <line x1="78" y1="16" x2="78" y2="52" stroke="#4a6a86" strokeWidth="1" />
            <line x1="110" y1="16" x2="110" y2="52" stroke="#4a6a86" strokeWidth="1" />
            <line x1="135" y1="16" x2="135" y2="52" stroke="#4a6a86" strokeWidth="1" />
            {[16, 36, 82, 102, 136].map((cx, i) => (
              <circle key={`w-${i}`} cx={cx} cy="54" r="7" fill="#060d14" stroke="#4a6a86" strokeWidth="1.5" />
            ))}
          </g>
        </g>

        {/* —— Center: vibrant fuel / gas station —— */}
        <g transform="translate(560, 600)">
          {/* Warm canopy wash */}
          <ellipse cx="175" cy="40" rx="200" ry="70" fill="url(#authStationGlow)" className="auth-station-glow" />

          {/* Forecourt */}
          <ellipse cx="175" cy="195" rx="210" ry="22" fill="#081018" opacity="0.8" />
          <path
            d="M20 188 H330"
            stroke="#3a6080"
            strokeWidth="3"
            strokeDasharray="18 10"
            opacity="0.45"
          />

          {/* Canopy */}
          <path d="M18 58 L332 58 L318 88 L32 88 Z" fill="url(#authCanopy)" />
          <path d="M18 58 L332 58 L326 48 L24 48 Z" fill="#3ad49a" opacity="0.9" />
          <rect x="28" y="88" width="294" height="5" fill="url(#authCanopyEdge)" />
          {/* Under-canopy lights */}
          {[55, 110, 165, 220, 275].map((x, i) => (
            <g key={`cl-${i}`}>
              <rect x={x} y="90" width="18" height="4" rx="1" fill="#fff6c8" />
              <ellipse cx={x + 9} cy="108" rx="16" ry="10" fill="#ffe08a" opacity="0.28" />
            </g>
          ))}

          {/* Support columns */}
          <rect x="48" y="93" width="8" height="88" fill="#2a455e" />
          <rect x="168" y="93" width="8" height="88" fill="#2a455e" />
          <rect x="288" y="93" width="8" height="88" fill="#2a455e" />

          {/* Store / kiosk */}
          <g transform="translate(0, 100)">
            <rect x="0" y="20" width="70" height="70" rx="3" fill="#1a3144" />
            <rect x="0" y="10" width="70" height="14" fill={primaryColor} fillOpacity="0.85" />
            <rect x="8" y="36" width="24" height="28" rx="2" fill="#7ec8ff" fillOpacity="0.35" />
            <rect x="38" y="36" width="24" height="28" rx="2" fill="#7ec8ff" fillOpacity="0.28" />
            <rect x="10" y="70" width="18" height="20" rx="1" fill="#0e1822" />
            <circle cx="55" cy="18" r="3" fill="#ffd24a" className="auth-node-pulse" />
          </g>

          {/* Pump islands */}
          {[95, 175, 255].map((x, i) => (
            <g key={`pump-${i}`} transform={`translate(${x}, 118)`}>
              <rect x="0" y="48" width="52" height="8" rx="2" fill="#24384c" />
              <rect x="10" y="8" width="32" height="48" rx="3" fill="#1e3a52" />
              <rect x="14" y="14" width="24" height="16" rx="2" fill="#0a1824" stroke="#5aefb0" strokeWidth="1" />
              <rect x="16" y="18" width="10" height="3" fill={primaryColor} fillOpacity="0.7" />
              <rect x="16" y="24" width="14" height="2" fill="#ffe08a" opacity="0.5" />
              <circle cx="36" cy="40" r="4" fill="#ff8c1a" fillOpacity="0.85" />
              <path
                d="M42 28 C58 28, 58 52, 48 52"
                fill="none"
                stroke="#6a8aa6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <rect x="44" y="48" width="8" height="12" rx="1" fill="#4a6a86" />
            </g>
          ))}

          {/* Price totem */}
          <g transform="translate(330, 70)">
            <rect x="10" y="20" width="8" height="100" fill="#2a455e" />
            <rect x="0" y="0" width="28" height="46" rx="3" fill="#122636" stroke={primaryColor} strokeWidth="1.5" />
            <rect x="4" y="6" width="20" height="8" rx="1" fill="#ffe08a" opacity="0.85" />
            <rect x="4" y="18" width="20" height="6" rx="1" fill={primaryColor} fillOpacity="0.65" />
            <rect x="4" y="28" width="20" height="6" rx="1" fill="#ff8c1a" fillOpacity="0.55" />
          </g>

          {/* Car at pump */}
          <g transform="translate(100, 168)">
            <rect x="8" y="8" width="70" height="22" rx="6" fill="#24384c" />
            <rect x="18" y="0" width="40" height="16" rx="5" fill="#2e4d68" />
            <rect x="22" y="4" width="14" height="8" rx="1" fill="#7ec8ff" fillOpacity="0.35" />
            <rect x="42" y="4" width="12" height="8" rx="1" fill="#7ec8ff" fillOpacity="0.28" />
            <circle cx="22" cy="32" r="7" fill="#060d14" stroke="#6a8aa6" strokeWidth="1.5" />
            <circle cx="64" cy="32" r="7" fill="#060d14" stroke="#6a8aa6" strokeWidth="1.5" />
            <rect x="70" y="14" width="6" height="4" fill="#ffd24a" opacity="0.8" />
          </g>
        </g>

        {/* —— Right: vibrant refinery —— */}
        <g transform="translate(980, 480)">
          <ellipse cx="230" cy="290" rx="250" ry="22" fill="#061018" opacity="0.75" />

          {/* Flare glow bloom */}
          <ellipse
            cx="78"
            cy="30"
            rx="70"
            ry="55"
            fill="url(#authFlareGlow)"
            filter="url(#authWarmBloom)"
            className="auth-flare-glow"
          />

          {/* Distillation column */}
          <g transform="translate(40, 40)">
            <rect x="22" y="70" width="48" height="180" rx="3" fill="url(#authMetalBright)" />
            <rect x="16" y="64" width="60" height="12" rx="2" fill="#6a8aa6" />
            {[100, 140, 180, 220].map((y, i) => (
              <rect key={`band-${i}`} x="16" y={y} width="60" height="8" fill="#3a6080" />
            ))}
            <rect x="34" y="20" width="24" height="44" fill="#1a2c3d" />
            {/* Flare tip + flame */}
            <rect x="40" y="0" width="12" height="22" fill="#24384c" />
            <g className="auth-flare-flicker" transform="translate(46, -8)">
              <path d="M0 12 C-8 0, -4 -18, 0 -28 C4 -18, 8 0, 0 12 Z" fill="url(#authFlare)" />
              <path d="M0 8 C-4 0, -2 -10, 0 -16 C2 -10, 4 0, 0 8 Z" fill="#fff6c8" opacity="0.75" />
            </g>
            {/* Pipe rack */}
            <path
              d="M70 110 H110 V160 H70"
              fill="none"
              stroke="#ffb347"
              strokeWidth="3.5"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d="M70 150 H125 V200 H70"
              fill="none"
              stroke="#5aefb0"
              strokeWidth="3"
              strokeLinejoin="round"
              opacity="0.55"
            />
            <rect x="110" y="145" width="28" height="36" rx="2" fill="#2a455e" />
            <rect x="114" y="152" width="20" height="8" rx="1" fill="#ff8c1a" fillOpacity="0.55" />
          </g>

          {/* Secondary process tower */}
          <g transform="translate(180, 90)">
            <rect x="14" y="50" width="34" height="150" rx="2" fill="url(#authMetal)" />
            <rect x="10" y="44" width="42" height="10" fill="#4a6a86" />
            <rect x="10" y="90" width="42" height="6" fill="#3a6080" />
            <rect x="10" y="130" width="42" height="6" fill="#3a6080" />
            <rect x="22" y="18" width="18" height="26" fill="#1a2c3d" />
            <circle cx="31" cy="12" r="5" fill="#ff8c1a" fillOpacity="0.65" className="auth-node-pulse" />
            <path
              d="M48 80 H78 V120"
              fill="none"
              stroke="#7ec8ff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.55"
            />
          </g>

          {/* Cooling / pipe structure */}
          <g transform="translate(250, 130)">
            <rect x="8" y="40" width="8" height="110" fill="#3a6080" />
            <rect x="40" y="40" width="8" height="110" fill="#3a6080" />
            <rect x="72" y="40" width="8" height="110" fill="#3a6080" />
            {[50, 80, 110].map((y, i) => (
              <rect key={`xf-${i}`} x="8" y={y} width="72" height="5" fill="#5a7a96" opacity="0.7" />
            ))}
            <circle cx="44" cy="30" r="10" fill="none" stroke="#ffb347" strokeWidth="2.5" opacity="0.65" />
            <circle cx="44" cy="30" r="4" fill="#ffd24a" fillOpacity="0.7" className="auth-node-pulse-delayed" />
          </g>

          {/* LPG sphere */}
          <g transform="translate(300, 150)">
            <circle cx="55" cy="70" r="54" fill="#1c3348" />
            <circle
              cx="55"
              cy="70"
              r="54"
              fill="none"
              stroke="#7ec8ff"
              strokeOpacity="0.4"
              strokeWidth="2"
            />
            <ellipse cx="38" cy="52" rx="16" ry="22" fill="#3a6080" opacity="0.45" />
            <rect x="50" y="120" width="10" height="20" fill="#0e1822" />
            <rect x="28" y="138" width="54" height="7" fill="#24384c" />
            <line x1="55" y1="16" x2="55" y2="4" stroke="#6a8aa6" strokeWidth="2.5" />
            <circle cx="55" cy="2" r="4" fill="#ffb347" fillOpacity="0.75" className="auth-node-pulse" />
          </g>

          {/* Product tank row */}
          <g transform="translate(120, 210)">
            <ellipse cx="14" cy="36" rx="12" ry="24" fill="#152433" />
            <rect x="14" y="12" width="100" height="48" fill="url(#authTankSide)" />
            <ellipse cx="114" cy="36" rx="12" ry="24" fill="#2e4d68" />
            <line x1="40" y1="12" x2="40" y2="60" stroke="#4a6a86" strokeWidth="1" />
            <line x1="70" y1="12" x2="70" y2="60" stroke="#4a6a86" strokeWidth="1" />
            <line x1="95" y1="12" x2="95" y2="60" stroke="#4a6a86" strokeWidth="1" />
          </g>

          {/* Tanker leaving refinery */}
          <g transform="translate(230, 250)">
            <rect x="105" y="16" width="36" height="28" rx="3" fill="#1e3a52" />
            <rect x="110" y="20" width="16" height="12" rx="1" fill="#0a1824" />
            <ellipse cx="10" cy="30" rx="8" ry="16" fill="#1a3144" />
            <rect x="10" y="14" width="95" height="32" fill="url(#authTankSide)" />
            <ellipse cx="105" cy="30" rx="8" ry="16" fill="#2e4d68" />
            {[28, 50, 78, 118, 132].map((cx, i) => (
              <circle key={`rw-${i}`} cx={cx} cy="50" r="6.5" fill="#060d14" stroke="#4a6a86" strokeWidth="1.5" />
            ))}
            <rect x="138" y="24" width="5" height="4" fill="#ffd24a" opacity="0.85" />
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
        <g fill="none" stroke="#243a50" strokeWidth="1" opacity="0.4">
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,13,20,0.28)_50%,rgba(7,13,20,0.7)_100%)]" />

      <style>{`
        @keyframes auth-flow {
          to { stroke-dashoffset: -120; }
        }
        @keyframes auth-node {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes auth-flare {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
          40% { transform: scaleY(1.12) scaleX(0.92); opacity: 1; }
          70% { transform: scaleY(0.94) scaleX(1.08); opacity: 0.88; }
        }
        @keyframes auth-flare-glow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes auth-station-glow {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
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
        .auth-flare-flicker {
          transform-origin: 50% 100%;
          transform-box: fill-box;
          animation: auth-flare 1.8s ease-in-out infinite;
        }
        .auth-flare-glow {
          animation: auth-flare-glow 2.4s ease-in-out infinite;
        }
        .auth-station-glow {
          animation: auth-station-glow 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-flow-a,
          .auth-flow-b,
          .auth-flow-c,
          .auth-node-pulse,
          .auth-node-pulse-delayed,
          .auth-flare-flicker,
          .auth-flare-glow,
          .auth-station-glow {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
