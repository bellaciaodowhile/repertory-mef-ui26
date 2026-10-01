import React from 'react';
import { Play, ListMusic, RefreshCw, Github } from 'lucide-react';
import { SongItem, HymnResourceKey, RESOURCE_METAS, GitHubConfig } from '../types/hymn';
import { VinylDisc } from './VinylDisc';

interface AlbumHeroCardProps {
  songs: SongItem[];
  onOpenPlayRepertoire: () => void;
  stats: { total: number; complete: number; incomplete: number };
  continuousVoice?: HymnResourceKey | null;
  gitHubConfig?: GitHubConfig;
  onSyncGitHub?: () => void;
  isSyncingGitHub?: boolean;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  isPlaying?: boolean;
}

export const AlbumHeroCard: React.FC<AlbumHeroCardProps> = ({
  onOpenPlayRepertoire,
  stats,
  continuousVoice,
  gitHubConfig,
  onSyncGitHub,
  isSyncingGitHub,
  onOpenAdmin,
  isAdmin = false,
  isPlaying = true,
}) => {
  const currentVoiceMeta = continuousVoice
    ? RESOURCE_METAS.find((m) => m.key === continuousVoice)
    : null;

  const hasGitHubRepo = Boolean(gitHubConfig?.owner && gitHubConfig?.repo);

  return (
    <div className="bg-white rounded-[28px] p-5 sm:p-7 shadow-sublime-card mb-5 transition-all">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Spinning Vinyl Record (Replaces the mountain landscape photo) */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <VinylDisc
            size="hero"
            isPlaying={isPlaying}
            label={currentVoiceMeta?.name || 'CORAL 2026'}
          />
        </div>

        {/* Album Metadata & Title */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start space-x-2 text-[11px] font-semibold text-neutral-400 mb-1.5 tracking-wider uppercase flex-wrap gap-y-1">
            <span>Álbum</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{stats.complete} Disponibles</span>
            <span>•</span>
            <span className="text-neutral-700">Oficial 2026</span>
            {isAdmin && hasGitHubRepo && (
              <>
                <span>•</span>
                <span className="text-neutral-500 flex items-center gap-1 font-mono">
                  <Github className="w-3 h-3 text-neutral-700" />
                  {gitHubConfig?.repo}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug">
            Repertorio de música en familia 2026 - A través de los años
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            Coral Música en Familia • Partituras y Guías SATB
          </p>

          {currentVoiceMeta && (
            <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Modo continuo:</span>
              <strong className="text-neutral-900">
                {currentVoiceMeta.key === 'demo'
                  ? 'Todas las Demos'
                  : currentVoiceMeta.key === 'pista'
                  ? 'Todas las Pistas'
                  : `Todos los ${currentVoiceMeta.name}s`}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Play Repertoire (+ GitHub Sync ONLY for Admin) */}
      <div className="mt-5 pt-4 border-t border-neutral-50 flex flex-col sm:flex-row items-center gap-2.5">
        <button
          onClick={onOpenPlayRepertoire}
          className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm shadow-sublime-button transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span>Reproducir Repertorio</span>
          <ListMusic className="w-4 h-4 text-neutral-400 ml-1" />
        </button>

        {/* GitHub Direct Sync / Connect Button - STRICTLY EXCLUSIVE TO ADMIN */}
        {isAdmin && (
          hasGitHubRepo ? (
            <button
              onClick={onSyncGitHub}
              disabled={isSyncingGitHub}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs transition-all active:scale-[0.98] border border-neutral-200/80"
              title="Actualizar canciones desde GitHub"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGitHub ? 'animate-spin' : ''}`} />
              <span>{isSyncingGitHub ? 'Sincronizando...' : 'Actualizar GitHub'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs transition-all active:scale-[0.98] border border-neutral-200/80"
              title="Conectar Repositorio de GitHub"
            >
              <Github className="w-4 h-4" />
              <span>Conectar GitHub</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};
