export function VaultDial({
  className,
}: {
  className?: string;
}) {
  const outerTicks = Array.from({ length: 36 });
  const innerTicks = Array.from({ length: 12 });

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer ring */}
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        className="stroke-border"
        strokeWidth="1.5"
      />

      {/* Rotating outer ticks */}
      <g
        className="origin-center animate-dial-turn-slow"
        style={{ transformOrigin: '100px 100px' }}
      >
        {outerTicks.map((_, i) => {
          const angle = (i / outerTicks.length) * 360;
          const major = i % 6 === 0;

          return (
            <line
              key={i}
              x1="100"
              y1={major ? 8 : 14}
              x2="100"
              y2={major ? 24 : 20}
              transform={`rotate(${angle} 100 100)`}
              className={
                major
                  ? 'stroke-primary'
                  : 'stroke-muted-foreground/30'
              }
              strokeWidth={major ? 2.5 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Middle ring */}
      <circle
        cx="100"
        cy="100"
        r="64"
        fill="none"
        className="stroke-border"
        strokeWidth="1"
      />

      {/* Rotating inner ring */}
      <g
        className="origin-center animate-spin"
        style={{
          transformOrigin: '100px 100px',
          animationDuration: '18s',
          animationDirection: 'reverse',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {innerTicks.map((_, i) => (
          <circle
            key={i}
            cx="100"
            cy="42"
            r="2.5"
            transform={`rotate(${(360 / innerTicks.length) * i} 100 100)`}
            className="fill-primary/70"
          />
        ))}
      </g>

      {/* Inner circle */}
      <circle
        cx="100"
        cy="100"
        r="42"
        fill="none"
        className="stroke-primary/20"
        strokeWidth="2"
      />

      {/* Dial */}

      <circle
        cx="100"
        cy="100"
        r="8"
        className="fill-primary"
      />

      <line
        x1="100"
        y1="100"
        x2="100"
        y2="58"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <line
        x1="100"
        y1="100"
        x2="128"
        y2="118"
        className="stroke-muted-foreground"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}