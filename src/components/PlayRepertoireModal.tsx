import React from 'react';
import { HymnResourceKey, RESOURCE_METAS } from '../types/hymn';
import { X, Play, Music } from 'lucide-react';

interface PlayRepertoireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoiceToPlayAll: (key: HymnResourceKey) => void;
  completeSongsCount: number;
}

export const PlayRepertoireModal: React.FC<PlayRepertoireModalProps> = ({
  isOpen,
  onClose,
  onSelectVoiceToPlayAll,
  completeSongsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-sublime-card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">
              Reproducción Continua • Álbum 2026
            </span>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Reproducir Todo el Repertorio
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="px-5 pt-4 pb-2 text-xs text-neutral-500">
          Selecciona la voz o modo que deseas escuchar en secuencia automática a través de las{' '}
          <strong className="text-neutral-900">{completeSongsCount} obras disponibles</strong>:
        </div>

        {/* Voice Selection List */}
        <div className="p-4 sm:p-5 space-y-2 overflow-y-auto max-h-[60vh]">
          {RESOURCE_METAS.map((meta) => {
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => onSelectVoiceToPlayAll(meta.key)}
                className="w-full py-3.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-900 hover:text-white group flex items-center justify-between transition-all active:scale-[0.98] text-left"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-white/20 text-neutral-800 group-hover:text-white flex items-center justify-center shadow-sm flex-shrink-0 transition-colors">
                    <Music className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-sm text-neutral-900 group-hover:text-white transition-colors">
                      {meta.key === 'demo'
                        ? 'Todas las Demos'
                        : meta.key === 'pista'
                        ? 'Todas las Pistas'
                        : `Todos los ${meta.name}s`}
                    </div>
                    <div className="text-[11px] text-neutral-400 group-hover:text-neutral-300 transition-colors">
                      {meta.role}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-neutral-200/80 group-hover:bg-white group-hover:text-neutral-900 text-neutral-700 flex items-center justify-center transition-colors flex-shrink-0 ml-2">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-center text-[11px] text-neutral-400">
          La reproducción avanzará automáticamente canción por canción con la voz elegida.
        </div>
      </div>
    </div>
  );
};
