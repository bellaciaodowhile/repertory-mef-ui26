import React, { useState, useRef, useEffect } from 'react';
import { SongItem, HymnResourceKey, RESOURCE_METAS, LyricsFileItem } from '../types/hymn';
import { downloadAudioFile } from '../services/audioCache';
import { GitHubApiService } from '../services/githubApi';
import {
  ChevronDown,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Download,
  Zap,
  MoreVertical,
  RotateCcw,
  RotateCw,
  FileText,
} from 'lucide-react';
import { VinylDisc } from './VinylDisc';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: SongItem | null;
  currentResourceKey: HymnResourceKey | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop?: () => void;
  onSelectResource: (song: SongItem, key: HymnResourceKey) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  playbackRate: number;
  onChangeSpeed: (rate: number) => void;
  isCached: boolean;
  onOpenLyrics?: (song: SongItem) => void;
  lyricsFile?: LyricsFileItem | null;
  gitHubToken?: string;
}

const SPECTRUM_HEIGHTS = [
  35, 52, 70, 45, 82, 95, 65, 40, 75, 100,
  85, 55, 68, 90, 75, 45, 62, 85, 95, 72,
  50, 80, 100, 90, 65, 45, 72, 88, 60, 76,
  95, 70, 42, 58, 82, 65, 50, 70, 48, 32
];

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  currentSong,
  currentResourceKey,
  isPlaying,
  onTogglePlay,
  onStop,
  onSelectResource,
  onNextTrack,
  onPrevTrack,
  currentTime,
  duration,
  onSeek,
  isLooping,
  onToggleLoop,
  playbackRate,
  onChangeSpeed,
  isCached,
  lyricsFile,
  gitHubToken,
}) => {
  // Lock body scroll only while modal is open, and restore unconditionally on close/unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.documentElement.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    }
  }, [isOpen]);

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [downloadingLyrics, setDownloadingLyrics] = useState(false);

  // High-precision scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !currentSong || !currentResourceKey) return null;

  const currentMeta = RESOURCE_METAS.find((m) => m.key === currentResourceKey);
  const activeResource = currentSong.resources?.[currentResourceKey];

  const handleDownloadLyricsPdf = async () => {
    if (!lyricsFile) return;
    setDownloadingLyrics(true);
    try {
      await GitHubApiService.downloadLyricsFile(lyricsFile, gitHubToken);
    } finally {
      setDownloadingLyrics(false);
    }
  };

  const displayTime = isScrubbing ? scrubTime : currentTime;
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, displayTime / duration)) : 0;

  const handleDownload = async (url: string, voiceName: string, fileName?: string, keyId?: string) => {
    if (!currentSong) return;
    setDownloadingKey(keyId || 'main');
    try {
      await downloadAudioFile(url, currentSong.title, voiceName, fileName);
    } finally {
      setDownloadingKey(null);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // High precision pointer scrub handlers
  const calculateTargetTime = (clientX: number) => {
    if (!progressBarRef.current || duration <= 0) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const target = calculateTargetTime(e.clientX);
    setScrubTime(target);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || duration <= 0) return;
    const target = calculateTargetTime(e.clientX);
    setScrubTime(target);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    if (duration > 0) {
      const target = calculateTargetTime(e.clientX);
      onSeek(target);
    }
    setIsScrubbing(false);
  };

  // Quick Rehearsal micro-jump (-5s / +5s)
  const handleMicroSkip = (deltaSeconds: number) => {
    if (duration <= 0) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
    onSeek(newTime);
  };

  // Stop playback and rewind to beginning (0:00)
  const handleStop = () => {
    if (onStop) {
      onStop();
    } else {
      if (isPlaying) onTogglePlay();
      onSeek(0);
    }
    setScrubTime(0);
    setIsScrubbing(false);
  };

  return (
    /* Modal a pantalla completa 100% sin scroll en el body ni en el modal */
    <div className="fixed inset-0 z-50 bg-white w-full h-[100dvh] overflow-hidden flex flex-col justify-between animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-xl mx-auto h-full flex flex-col justify-between p-3.5 sm:p-6 overflow-hidden">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pt-0.5 sm:pt-1 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
            title="Minimizar reproductor"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">
              REPRODUCIENDO AHORA
            </span>
            {isCached && (
              <span className="inline-flex items-center space-x-1 text-[10px] text-neutral-500 font-medium">
                <Zap className="w-2.5 h-2.5 fill-neutral-600 text-neutral-600" />
                <span>Guardado en caché</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-0.5 -mr-2 relative">
            {/* 3-DOTS BUTTON (⋮) */}
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Opciones y descarga (3 puntos)"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 3-DOTS MENU DROPDOWN */}
            {showOptionsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowOptionsMenu(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-64 bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                    Opciones de Reproducción
                  </div>

                  {activeResource?.url && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        handleDownload(
                          activeResource.url,
                          currentMeta?.name || 'Audio',
                          activeResource.fileName,
                          'main'
                        );
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-left text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block truncate">Descargar pista actual</span>
                        <span className="text-[10px] text-neutral-400 block truncate font-mono">
                          [{currentSong.title} - {currentMeta?.name}]
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Botón en el menú para descargar el documento de letras */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      handleDownloadLyricsPdf();
                    }}
                    disabled={downloadingLyrics}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-50 text-left text-xs font-semibold text-neutral-800 transition-colors cursor-pointer border-t border-neutral-100"
                  >
                    <Download className={`w-4 h-4 text-neutral-600 flex-shrink-0 ${downloadingLyrics ? 'animate-bounce' : ''}`} />
                    <div className="min-w-0">
                      <span className="block truncate">Descargar Letras (PDF)</span>
                      <span className="text-[10px] text-neutral-400 block truncate font-mono">
                        {lyricsFile?.fileName || 'LETRAS MEF 2026.pdf'}
                      </span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DISCO GIRANDO EN BLANCO Y NEGRO (Black & White Spinning Vinyl Record) */}
        {/* ========================================================================= */}
        <div className="my-1.5 sm:my-3 flex justify-center items-center select-none flex-shrink min-h-0">
          <VinylDisc
            size="lg"
            isPlaying={isPlaying}
            label={currentMeta?.name || 'CORO'}
          />
        </div>

        {/* Title, Subtitle & Direct Voice Download button */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1 flex-shrink-0">
          <div className="text-left flex-1 min-w-0 pr-3">
            <h2 className="text-base sm:text-xl font-bold text-neutral-900 truncate tracking-tight">
              {currentSong.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-0.5 truncate">
              {currentSong.composer || 'Coral Música en Familia'}
            </p>
          </div>

          {/* Download button appears in full screen */}
          {activeResource?.url && (
            <button
              type="button"
              onClick={() =>
                handleDownload(
                  activeResource.url,
                  currentMeta?.name || 'Audio',
                  activeResource.fileName,
                  'main'
                )
              }
              disabled={downloadingKey === 'main'}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title={`Descargar [${currentSong.title} - ${currentMeta?.name}]`}
            >
              <Download className={`w-3.5 h-3.5 ${downloadingKey === 'main' ? 'animate-bounce' : ''}`} />
              <span>{downloadingKey === 'main' ? 'Descargando...' : 'Descargar'}</span>
            </button>
          )}
        </div>

        {/* SATB Voice Switcher Bar with Individual Download Options */}
        <div className="mb-2 sm:mb-3 bg-neutral-50 p-1.5 sm:p-2 rounded-2xl flex-shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5 px-2">
            <span>SELECCIONAR VOZ</span>
            <span className="text-neutral-900 font-bold">{currentMeta?.role}</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {RESOURCE_METAS.map((meta) => {
              const res = currentSong.resources[meta.key];
              const exists = !!(res && res.url);
              const isSelected = currentResourceKey === meta.key;
              const isThisDownloading = downloadingKey === meta.key;

              return (
                <div
                  key={meta.key}
                  className={`relative rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? `${meta.activeBgClass} shadow-sublime-button`
                      : exists
                      ? `${meta.colorClass} shadow-sm cursor-pointer`
                      : 'bg-transparent text-neutral-300 opacity-35 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (exists) onSelectResource(currentSong, meta.key);
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {meta.shortName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE REPRODUCCIÓN CON ESPECTRO DE AUDIO Y BOTONES DE 5 SEGUNDOS */}
        {/* ========================================================================= */}
        <div className="mb-2 sm:mb-3 space-y-1 select-none flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 w-full">
            {/* Botón -5s exclusivamente al lado izquierdo de la barra */}
            <button
              type="button"
              onClick={() => handleMicroSkip(-5)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-90 text-neutral-800 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0 group"
              title="Retroceder 5 segundos"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-rotate-45 transition-transform" />
              <span className="text-[9px] font-bold font-mono leading-none mt-0.5">-5s</span>
            </button>

            {/* Espectro de Audio y Barra de Scrubbing Interactiva */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div
                ref={progressBarRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative py-1.5 cursor-pointer group touch-none select-none"
                title="Desliza sobre el espectro de audio para avanzar o retroceder con precisión"
              >
                {/* Espectro con barras de audio dinámicas */}
                <div className="w-full h-8 sm:h-10 flex items-center justify-between gap-[2px] sm:gap-[3px] px-0.5">
                  {SPECTRUM_HEIGHTS.map((heightPercent, idx) => {
                    const barRatio = idx / (SPECTRUM_HEIGHTS.length - 1);
                    const isPlayed = barRatio <= progressRatio;
                    return (
                      <div
                        key={idx}
                        style={{ height: `${heightPercent}%` }}
                        className={`flex-1 rounded-full transition-all duration-150 ${
                          isPlayed
                            ? 'bg-neutral-900 shadow-sm'
                            : 'bg-neutral-200 group-hover:bg-neutral-300'
                        } ${isPlaying && isPlayed ? 'opacity-100' : 'opacity-85'}`}
                      />
                    );
                  })}
                </div>

                {/* Línea de base sutil debajo del espectro */}
                <div className="w-full h-1 bg-neutral-100 rounded-full mt-1 overflow-hidden relative border border-neutral-200/50">
                  <div
                    style={{ width: `${progressRatio * 100}%` }}
                    className="h-full bg-neutral-900 rounded-full transition-[width] duration-75"
                  />
                </div>

                {isScrubbing && (
                  <div
                    style={{ left: `${progressRatio * 100}%` }}
                    className="absolute -top-6 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                  >
                    {formatTime(scrubTime)}
                  </div>
                )}
              </div>

              {/* Tiempos transcurrido y total */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-0.5 -mt-0.5">
                <span className="font-bold text-neutral-900 text-xs">{formatTime(displayTime)}</span>
                <span className="text-neutral-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Botón +5s exclusivamente al lado derecho de la barra */}
            <button
              type="button"
              onClick={() => handleMicroSkip(5)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-neutral-100 hover:bg-neutral-200 active:scale-90 text-neutral-800 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0 group"
              title="Adelantar 5 segundos"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-45 transition-transform" />
              <span className="text-[9px] font-bold font-mono leading-none mt-0.5">+5s</span>
            </button>
          </div>
        </div>

        {/* Player Transport Controls: Limpio, sin 1x y sin botones de 5s repetidos */}
        <div className="flex items-center justify-between px-3 sm:px-6 mb-2">
          {/* Bucle / Loop Mode */}
          <button
            onClick={onToggleLoop}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${
              isLooping ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title={isLooping ? 'Bucle activado' : 'Repetir en bucle'}
          >
            <Repeat className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-all active:scale-90 cursor-pointer"
            title="Canción anterior"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Big Circular Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-sublime-dock hover:bg-neutral-800 transition-transform active:scale-95 cursor-pointer flex-shrink-0"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* STOP Button: Detiene la música y regresa al principio (0:00) */}
          <button
            type="button"
            onClick={handleStop}
            className="w-11 h-11 rounded-2xl bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-800 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm group active:scale-90 flex-shrink-0"
            title="Stop: Detener y volver al principio (0:00)"
          >
            <Square className="w-4 h-4 fill-current transition-transform group-hover:scale-105" />
            <span className="text-[8px] font-bold font-mono tracking-tight leading-none mt-0.5">STOP</span>
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-all active:scale-90 cursor-pointer"
            title="Siguiente canción"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
