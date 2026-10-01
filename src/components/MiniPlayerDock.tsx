import React from 'react';
import { SongItem, HymnResourceKey, RESOURCE_METAS } from '../types/hymn';
import { Play, Pause, Zap } from 'lucide-react';
import { VinylDisc } from './VinylDisc';

interface MiniPlayerDockProps {
  currentSong: SongItem | null;
  currentResourceKey: HymnResourceKey | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenNowPlaying: () => void;
  isCached: boolean;
}

export const MiniPlayerDock: React.FC<MiniPlayerDockProps> = ({
  currentSong,
  currentResourceKey,
  isPlaying,
  onTogglePlay,
  onOpenNowPlaying,
  isCached,
}) => {
  if (!currentSong || !currentResourceKey) return null;

  const currentMeta = RESOURCE_METAS.find((m) => m.key === currentResourceKey);

  return (
    /* Barra de reproduccion fija en el bottom 0 a 100% del ancho */
    <div className="fixed bottom-0 left-0 right-0 w-full z-40 bg-neutral-900/98 backdrop-blur-xl text-white shadow-sublime-dock border-t border-neutral-800 transition-all pb-[env(safe-area-inset-bottom)]">
      <div
        onClick={onOpenNowPlaying}
        className="cursor-pointer max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3"
      >
        {/* Left: Spinning Vinyl Disc & Title */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <VinylDisc size="sm" isPlaying={isPlaying} label={currentMeta?.shortName || 'CORO'} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
                {currentSong.title}
              </h4>
              {isCached && (
                <span title="Audio en caché local">
                  <Zap className="w-3 h-3 fill-neutral-400 text-neutral-400 flex-shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 mt-0.5">
              <span className="text-white font-semibold">{currentMeta?.name}</span>
              <span>•</span>
              <span className="truncate">Toca para abrir en grande</span>
            </div>
          </div>
        </div>

        {/* Right: Big Play/Pause Button */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-9 h-9 rounded-full bg-white text-neutral-900 flex items-center justify-center font-bold shadow transition-transform active:scale-90 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-neutral-900" />
            ) : (
              <Play className="w-4 h-4 fill-neutral-900 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
