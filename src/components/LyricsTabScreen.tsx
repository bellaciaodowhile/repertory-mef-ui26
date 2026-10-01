import React, { useState, useMemo } from 'react';
import { SongItem, LyricsFileItem, GitHubConfig } from '../types/hymn';
import { GitHubApiService } from '../services/githubApi';
import {
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronDown,
  Folder,
  Music,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface LyricsTabScreenProps {
  songs?: SongItem[];
  lyricsFile: LyricsFileItem | null;
  gitHubConfig: GitHubConfig;
  onRefreshGitHub?: () => void;
  isSyncingGitHub?: boolean;
}

export const LyricsTabScreen: React.FC<LyricsTabScreenProps> = ({
  songs = [],
  lyricsFile,
  gitHubConfig,
  onRefreshGitHub,
  isSyncingGitHub = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(songs[0]?.id || null);
  const [fontSize, setFontSize] = useState<number>(15);
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // The official PDF file object
  const effectiveFile: LyricsFileItem = lyricsFile || {
    fileName: 'LETRAS MEF 2026.pdf',
    path: 'Letras/LETRAS MEF 2026.pdf',
    rawUrl: gitHubConfig.owner && gitHubConfig.repo
      ? `https://raw.githubusercontent.com/${encodeURIComponent(gitHubConfig.owner)}/${encodeURIComponent(gitHubConfig.repo)}/${encodeURIComponent(gitHubConfig.branch || 'main')}/Letras/LETRAS%20MEF%202026.pdf`
      : '',
    extension: 'pdf',
  };

  // Filter songs by search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.number.toString().includes(q) ||
        (s.lyrics && s.lyrics.toLowerCase().includes(q)) ||
        (s.composer && s.composer.toLowerCase().includes(q))
    );
  }, [songs, searchQuery]);

  // Handle copying a song's lyrics
  const handleCopySongLyrics = (song: SongItem) => {
    const text = `${song.title}\n${song.composer ? `Compositor: ${song.composer}\n` : ''}\n${song.lyrics}`;
    navigator.clipboard.writeText(text);
    setCopiedSongId(song.id);
    setTimeout(() => setCopiedSongId(null), 2000);
  };

  // Open web viewer safely without triggering browser download
  const handleOpenPdfViewer = () => {
    if (!effectiveFile.rawUrl) return;
    const safeViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(effectiveFile.rawUrl)}`;
    window.open(safeViewerUrl, '_blank', 'noopener,noreferrer');
  };

  // Explicit manual download only when user deliberately clicks the download button
  const handleManualDownload = async () => {
    if (!effectiveFile || !effectiveFile.rawUrl) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await GitHubApiService.downloadLyricsFile(effectiveFile, gitHubConfig.token);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.warn('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 pb-12 select-none">
      {/* Header Card: Cancionero y Controles de Lectura */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] shadow-sublime border border-neutral-100/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-neutral-800" />
              <span>Cancionero Coral 2026</span>
              <span>•</span>
              <span className="text-neutral-600 font-semibold">{songs.length} himnos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Letras del Repertorio
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lectura directa en pantalla para ensayos y presentaciones.
            </p>
          </div>

          {/* Controles de Zoom para el tamaño de letra */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-neutral-50 p-1.5 rounded-2xl border border-neutral-200/60">
            <span className="text-[10px] font-bold text-neutral-400 uppercase px-2 font-mono">
              Tamaño:
            </span>
            <button
              type="button"
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 shadow-sm transition-colors cursor-pointer"
              title="Reducir tamaño de letra"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-neutral-800 px-1.5">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize(Math.min(26, fontSize + 1))}
              className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 shadow-sm transition-colors cursor-pointer"
              title="Aumentar tamaño de letra"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar for Songs */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, número o estrofa..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/70 rounded-2xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Official PDF Document Card (View safely without auto-download) */}
      <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-[24px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Archivo PDF Oficial
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold truncate text-white">
              {effectiveFile.fileName}
            </h4>
            <span className="text-[10px] text-neutral-400 font-mono block">
              Letras/{effectiveFile.fileName}
            </span>
          </div>
        </div>

        {/* Acciones del PDF: Abrir visor web (sin descarga) o descarga manual opcional */}
        <div className="flex items-center space-x-2 flex-shrink-0 pt-1 sm:pt-0">
          {effectiveFile.rawUrl && (
            <button
              type="button"
              onClick={handleOpenPdfViewer}
              className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer"
              title="Abrir visor de lectura web (sin descargar)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver en Visor Web</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleManualDownload}
            disabled={isDownloading || !effectiveFile.rawUrl}
            className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 active:scale-95 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40"
            title="Descargar copia del PDF sólo si la necesitas"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Descargando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="py-2.5 px-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center space-x-2 border border-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>¡Documento {effectiveFile.fileName} guardado con éxito!</span>
        </div>
      )}

      {/* Songs Lyrics List (Direct on-screen reading) */}
      <div className="space-y-3">
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song) => {
            const isExpanded = expandedSongId === song.id;
            const isCopied = copiedSongId === song.id;

            return (
              <div
                key={song.id}
                className="bg-white rounded-[24px] border border-neutral-100 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Header row to tap and toggle lyrics */}
                <div
                  onClick={() => setExpandedSongId(isExpanded ? null : song.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/70 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {song.number < 10 ? `0${song.number}` : song.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                        {song.title}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate">
                        {song.composer || 'Coral Música en Familia'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-neutral-900' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Lyrics Content */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-neutral-100 bg-neutral-50/40 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between py-2 border-b border-neutral-200/60 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Letra Completa
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySongLyrics(song)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Copiar letra"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formatted Lyrics Text with Zoomable Font Size */}
                    <div
                      style={{ fontSize: `${fontSize}px` }}
                      className="font-sans leading-relaxed text-neutral-800 whitespace-pre-line tracking-wide select-text py-1"
                    >
                      {song.lyrics || 'Letra no disponible aún para este himno.'}
                    </div>

                    {song.notes && (
                      <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                        <span className="font-bold block mb-0.5">Nota de ensayo:</span>
                        {song.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white rounded-[28px] border border-neutral-100 p-6 space-y-2">
            <Music className="w-8 h-8 text-neutral-300 mx-auto" />
            <h4 className="text-sm font-bold text-neutral-700">
              No se encontraron canciones con "{searchQuery}"
            </h4>
            <p className="text-xs text-neutral-400">
              Prueba con otro título o limpia el buscador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
