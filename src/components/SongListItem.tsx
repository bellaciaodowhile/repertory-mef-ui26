import React, { useState, useEffect } from 'react';
import { SongItem, HymnResourceKey, RESOURCE_METAS } from '../types/hymn';
import {
  Play,
  Pause,
  CheckCircle2,
  ChevronDown,
  Music,
} from 'lucide-react';

interface SongListItemProps {
  song: SongItem;
  index: number;
  currentPlaying: {
    songId: string;
    resourceKey: HymnResourceKey;
    isPlaying: boolean;
  } | null;
  onSelectSongBig: (song: SongItem, defaultKey?: HymnResourceKey) => void;
  cachedUrls: Set<string>;
  onOpenLyrics?: (song: SongItem) => void;
}

export const SongListItem: React.FC<SongListItemProps> = ({
  song,
  index,
  currentPlaying,
  onSelectSongBig,
}) => {
  // Count available resources
  const availableKeys = (Object.keys(song.resources) as HymnResourceKey[]).filter(
    (k) => song.resources[k]?.url
  );
  const resourceCount = availableKeys.length;
  const isComplete = resourceCount === 6;

  // Format index: 01, 02, etc.
  const formattedIndex = index < 9 ? `0${index + 1}` : `${index + 1}`;

  // Is this song currently playing?
  const isCurrentActiveSong = currentPlaying?.songId === song.id;
  const isSongPlaying = isCurrentActiveSong && currentPlaying?.isPlaying;

  // Accordion state: open by default if it's currently active, or toggleable
  const [isExpanded, setIsExpanded] = useState<boolean>(isCurrentActiveSong);

  useEffect(() => {
    if (isCurrentActiveSong) {
      setIsExpanded(true);
    }
  }, [isCurrentActiveSong]);

  // Filter only the voices that THIS song actually has
  const availableVoiceMetas = RESOURCE_METAS.filter(
    (meta) => !!(song.resources[meta.key] && song.resources[meta.key]?.url)
  );

  return (
    <div className="bg-white rounded-[26px] shadow-sublime hover:shadow-sublime-card transition-all duration-200 overflow-hidden relative">
      {/* Header clickable: Toggles accordion */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Index or Soundwave icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs text-neutral-400 font-mono bg-neutral-50">
            {isSongPlaying ? (
              <div className="flex items-end space-x-0.5 h-4">
                <span className="w-1 bg-neutral-900 rounded-full wave-1"></span>
                <span className="w-1 bg-neutral-900 rounded-full wave-2"></span>
                <span className="w-1 bg-neutral-900 rounded-full wave-3"></span>
              </div>
            ) : (
              <span>{formattedIndex}</span>
            )}
          </div>

          {/* Musical Note Icon Thumbnail */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-200 ${
              isSongPlaying
                ? 'bg-neutral-900 text-white shadow-sublime-button scale-105'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <Music className="w-5 h-5" />
          </div>

          {/* Title & Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate tracking-tight">
                {song.title}
              </h3>
              {/* If complete: green check. If has some voices: show available count */}
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : resourceCount > 0 ? (
                <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {resourceCount}/6
                </span>
              ) : null}
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5 truncate">
              {resourceCount > 0 ? (
                <span className="text-neutral-600 font-medium">
                  {resourceCount === 1 ? '1 voz disponible' : `${resourceCount} voces disponibles`}
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Sin audios aún</span>
              )}
              {song.keySignature && (
                <>
                  <span>•</span>
                  <span className="text-neutral-500">{song.keySignature}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Accordion toggle arrow */}
        <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title={isExpanded ? 'Contraer voces' : 'Ver voces'}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${
                isExpanded ? 'rotate-180 text-neutral-900' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ACCORDION CONTENT: Shows the voices that THIS song actually has */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-neutral-100">
            <div className="mb-2 px-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <span>Voces Disponibles</span>
              <span>Toca para abrir y escuchar</span>
            </div>

            {availableVoiceMetas.length > 0 ? (
              <div className="space-y-1.5">
                {availableVoiceMetas.map((meta) => {
                  const isPlayingThis =
                    isCurrentActiveSong &&
                    currentPlaying?.resourceKey === meta.key &&
                    currentPlaying?.isPlaying;

                  return (
                    <button
                      key={meta.key}
                      type="button"
                      onClick={() => onSelectSongBig(song, meta.key)}
                      className={`w-full py-2.5 px-3 sm:px-4 rounded-2xl flex items-center justify-between transition-all select-none text-left cursor-pointer active:scale-[0.99] ${
                        isPlayingThis
                          ? 'bg-neutral-900 text-white shadow-sublime-button'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {/* Left: Musical note icon + Full voice name & role */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isPlayingThis
                              ? 'bg-white text-neutral-900'
                              : 'bg-white text-neutral-600 shadow-sm'
                          }`}
                        >
                          <Music className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm tracking-tight truncate">
                              {meta.name}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] block truncate ${
                              isPlayingThis ? 'text-neutral-300' : 'text-neutral-400'
                            }`}
                          >
                            {meta.role}
                          </span>
                        </div>
                      </div>

                      {/* Right: Clean Play / Pause Button (No download icon, no 3 dots in voice list) */}
                      <div className="flex items-center pl-2 flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                            isPlayingThis
                              ? 'bg-white text-neutral-900'
                              : 'bg-neutral-200/80 text-neutral-800'
                          }`}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl">
                Esta canción aún no tiene pistas de audio subidas en GitHub.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
