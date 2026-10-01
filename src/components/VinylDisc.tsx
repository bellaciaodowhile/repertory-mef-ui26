import React from 'react';

interface VinylDiscProps {
  size?: 'sm' | 'md' | 'hero' | 'lg';
  isPlaying?: boolean;
  label?: string;
  className?: string;
}

export const VinylDisc: React.FC<VinylDiscProps> = ({
  size = 'lg',
  isPlaying = true,
  label = 'CORO',
  className = '',
}) => {
  // Dimensions based on size prop
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-20 h-20',
    hero: 'w-28 h-28 sm:w-36 sm:h-36',
    lg: 'w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 max-w-[65vw] max-h-[35vh] aspect-square',
  };

  const centerLabelClasses = {
    sm: 'w-5 h-5 border-[1.5px]',
    md: 'w-9 h-9 border-2',
    hero: 'w-12 h-12 sm:w-16 sm:h-16 border-2',
    lg: 'w-22 h-22 sm:w-28 sm:h-28 border-2 sm:border-4',
  };

  const spindleClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    hero: 'w-3 h-3 sm:w-4 sm:h-4',
    lg: 'w-4 h-4 sm:w-5 sm:h-5',
  };

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      {/* Outer ambient shadow */}
      {(size === 'lg' || size === 'hero') && (
        <div className="absolute inset-0 rounded-full bg-black/25 blur-xl transform scale-95 pointer-events-none" />
      )}

      {/* The Vinyl Disc itself */}
      <div
        style={{
          animation: 'spin 12s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
        className={`relative ${sizeClasses[size]} rounded-full bg-[#111111] shadow-2xl flex items-center justify-center border-2 sm:border-4 border-neutral-900 overflow-hidden`}
      >
        {/* Vinyl Grooves & Radial Specular Conic Reflections in Black & White */}
        <div
          className="absolute inset-0 rounded-full opacity-45 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle, transparent 38%, rgba(255,255,255,0.08) 38.5%, transparent 39%),
              radial-gradient(circle, transparent 44%, rgba(255,255,255,0.06) 44.5%, transparent 45%),
              radial-gradient(circle, transparent 50%, rgba(255,255,255,0.09) 50.5%, transparent 51%),
              radial-gradient(circle, transparent 56%, rgba(255,255,255,0.06) 56.5%, transparent 57%),
              radial-gradient(circle, transparent 62%, rgba(255,255,255,0.09) 62.5%, transparent 63%),
              radial-gradient(circle, transparent 68%, rgba(255,255,255,0.06) 68.5%, transparent 69%),
              radial-gradient(circle, transparent 74%, rgba(255,255,255,0.09) 74.5%, transparent 75%),
              radial-gradient(circle, transparent 80%, rgba(255,255,255,0.06) 80.5%, transparent 81%),
              radial-gradient(circle, transparent 86%, rgba(255,255,255,0.09) 86.5%, transparent 87%),
              radial-gradient(circle, transparent 92%, rgba(255,255,255,0.06) 92.5%, transparent 93%),
              conic-gradient(from 0deg, rgba(255,255,255,0.18) 0deg, transparent 50deg, rgba(255,255,255,0.22) 90deg, transparent 140deg, rgba(255,255,255,0.18) 180deg, transparent 230deg, rgba(255,255,255,0.22) 270deg, transparent 320deg, rgba(255,255,255,0.18) 360deg)
            `,
          }}
        />

        {/* Concentric rings for large and hero view */}
        {(size === 'lg' || size === 'hero') && (
          <>
            <div className="absolute inset-3 sm:inset-5 rounded-full border border-neutral-700/40 pointer-events-none" />
            <div className="absolute inset-6 sm:inset-10 rounded-full border border-neutral-800/80 pointer-events-none" />
            {size === 'lg' && (
              <div className="absolute inset-16 rounded-full border border-neutral-700/30 pointer-events-none" />
            )}
          </>
        )}

        {/* Center Vinyl Label in Black and White */}
        <div
          className={`relative ${centerLabelClasses[size]} rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center text-center border-neutral-800 shadow-inner z-10 p-1`}
        >
          {size === 'lg' && (
            <>
              <div className="absolute inset-1.5 rounded-full border border-dashed border-neutral-600/70 pointer-events-none" />
              <span className="text-[7px] sm:text-[8px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                MÚSICA EN FAMILIA
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase mt-0.5 max-w-[90%] truncate">
                {label}
              </span>
              <span className="text-[7px] font-mono text-neutral-400 mt-0.5">
                33 ⅓ RPM • 2026
              </span>
            </>
          )}

          {size === 'hero' && (
            <>
              <span className="text-[6px] sm:text-[7px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                2026
              </span>
              <span className="text-[8px] sm:text-[10px] font-black tracking-wider text-white uppercase truncate max-w-[90%]">
                {label}
              </span>
              <span className="text-[6px] sm:text-[7px] font-mono text-neutral-400">
                SATB
              </span>
            </>
          )}

          {size === 'md' && (
            <span className="text-[8px] font-bold tracking-tight text-white uppercase truncate px-1">
              {label}
            </span>
          )}

          {/* Center Spindle Hole */}
          <div
            className={`${spindleClasses[size]} rounded-full bg-neutral-200 border border-neutral-400 shadow-inner flex items-center justify-center ${
              size === 'lg' || size === 'hero' ? 'mt-0.5' : ''
            }`}
          >
            <div className="w-1/2 h-1/2 rounded-full bg-neutral-950" />
          </div>
        </div>
      </div>
    </div>
  );
};
