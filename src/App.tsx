import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SongItem, GitHubConfig, HymnResourceKey, LyricsFileItem, DEFAULT_GITHUB_CONFIG } from './types/hymn';
import { createInitialHymns } from './data/initialHymns';
import { AudioCacheService } from './services/audioCache';
import { GitHubApiService } from './services/githubApi';
import { MobileTopBar } from './components/MobileTopBar';
import { AlbumHeroCard } from './components/AlbumHeroCard';
import { SongListItem } from './components/SongListItem';
import { MiniPlayerDock } from './components/MiniPlayerDock';
import { NowPlayingModal } from './components/NowPlayingModal';
import { PlayRepertoireModal } from './components/PlayRepertoireModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY_SONGS = 'musica_en_familia_repertorio_2026_v6';
const STORAGE_KEY_LYRICS_FILE = 'musica_en_familia_lyrics_file_v3';

export default function App() {
  const [songs, setSongs] = useState<SongItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SONGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load songs from localStorage:', e);
    }
    return createInitialHymns();
  });

  // Repositorio directo y permanente: mef-2026-repertory
  const gitHubConfig: GitHubConfig = DEFAULT_GITHUB_CONFIG;

  // Global lyrics file from "Letras" folder in GitHub
  const [lyricsFile, setLyricsFile] = useState<LyricsFileItem | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LYRICS_FILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fileName: 'LETRAS MEF 2026.pdf',
      path: 'Letras/LETRAS MEF 2026.pdf',
      rawUrl: `https://raw.githubusercontent.com/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.owner)}/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.repo)}/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.branch)}/Letras/LETRAS%20MEF%202026.pdf`,
      extension: 'pdf',
    };
  });

  // Cached URLs Set
  const [cachedUrls, setCachedUrls] = useState<Set<string>>(new Set());

  // GitHub Sync State
  const [isSyncingGitHub, setIsSyncingGitHub] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<SongItem | null>(null);
  const [currentResourceKey, setCurrentResourceKey] = useState<HymnResourceKey | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Continuous Repertoire Mode
  const [continuousVoice, setContinuousVoice] = useState<HymnResourceKey | null>(null);
  const [isPlayRepertoireOpen, setIsPlayRepertoireOpen] = useState<boolean>(false);

  // Modals & Navigation
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isDownloadingLyrics, setIsDownloadingLyrics] = useState<boolean>(false);

  // Search (Available from top bar)
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist Songs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs));
    } catch (e) {
      console.warn('Error saving songs:', e);
    }
  }, [songs]);

  // Persist Lyrics file
  useEffect(() => {
    if (lyricsFile) {
      try {
        localStorage.setItem(STORAGE_KEY_LYRICS_FILE, JSON.stringify(lyricsFile));
      } catch {}
    }
  }, [lyricsFile]);

  // Load Cached keys
  const refreshCached = async () => {
    const keys = await AudioCacheService.getAllCachedKeys();
    setCachedUrls(keys);
  };

  useEffect(() => {
    refreshCached();
  }, []);

  // Sync Audio Element
  const activeResource = currentSong && currentResourceKey ? currentSong.resources[currentResourceKey] : null;

  useEffect(() => {
    if (!audioRef.current || !activeResource?.url) return;
    const audio = audioRef.current;

    AudioCacheService.isCached(activeResource.url).then((cached) => {
      if (!cached && activeResource.url) {
        AudioCacheService.cacheAudio(activeResource.url, currentSong?.id || '', currentResourceKey || '').then(
          (ok) => {
            if (ok) refreshCached();
          }
        );
      }
    });

    audio.src = activeResource.url;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentSong?.id, currentResourceKey, activeResource?.url]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle rate and loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
    }
  }, [playbackRate, isLooping]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  // Play Resource Trigger
  const handlePlayResource = (song: SongItem, resourceKey: HymnResourceKey) => {
    if (currentSong?.id === song.id && currentResourceKey === resourceKey) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setCurrentResourceKey(resourceKey);
      setIsPlaying(true);
    }
  };

  // Stop Resource and Reset to beginning
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Select Song in Big (Now Playing view)
  const handleSelectSongBig = (song: SongItem, defaultKey?: HymnResourceKey) => {
    let keyToPlay = defaultKey;
    if (!keyToPlay) {
      keyToPlay = (Object.keys(song.resources) as HymnResourceKey[]).find((k) => song.resources[k]?.url) || 'demo';
    }
    setCurrentSong(song);
    setCurrentResourceKey(keyToPlay);
    setIsPlaying(true);
    setIsNowPlayingOpen(true);
  };

  // Continuous Playback with specific voice across all songs that have that voice
  const handleSelectVoiceToPlayAll = (voiceKey: HymnResourceKey) => {
    setContinuousVoice(voiceKey);
    setIsPlayRepertoireOpen(false);

    const songsWithVoice = songs.filter((s) => s.resources[voiceKey]?.url);
    const targetList = songsWithVoice.length > 0 ? songsWithVoice : songs;

    if (targetList.length > 0) {
      handlePlayResource(targetList[0], voiceKey);
      setIsNowPlayingOpen(true);
    }
  };

  // Next / Prev Song (Honors continuous voice & songs with audio)
  const handleNextTrack = () => {
    if (!currentSong) return;

    const key = continuousVoice || currentResourceKey || 'demo';

    const candidateSongs = continuousVoice
      ? songs.filter((s) => s.resources[continuousVoice]?.url)
      : songs.filter((s) => (Object.keys(s.resources) as HymnResourceKey[]).some((k) => s.resources[k]?.url));

    const activeList = candidateSongs.length > 0 ? candidateSongs : songs;
    const idx = activeList.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (idx + 1) % activeList.length;
    const nextSong = activeList[nextIdx];

    if (nextSong.resources[key]?.url) {
      handlePlayResource(nextSong, key);
    } else {
      const fallbackKey = (Object.keys(nextSong.resources) as HymnResourceKey[]).find((k) => nextSong.resources[k]?.url);
      if (fallbackKey) handlePlayResource(nextSong, fallbackKey);
    }
  };

  const handlePrevTrack = () => {
    if (!currentSong) return;

    const key = continuousVoice || currentResourceKey || 'demo';

    const candidateSongs = continuousVoice
      ? songs.filter((s) => s.resources[continuousVoice]?.url)
      : songs.filter((s) => (Object.keys(s.resources) as HymnResourceKey[]).some((k) => s.resources[k]?.url));

    const activeList = candidateSongs.length > 0 ? candidateSongs : songs;
    const idx = activeList.findIndex((s) => s.id === currentSong.id);
    const prevIdx = (idx - 1 + activeList.length) % activeList.length;
    const prevSong = activeList[prevIdx];

    if (prevSong.resources[key]?.url) {
      handlePlayResource(prevSong, key);
    } else {
      const fallbackKey = (Object.keys(prevSong.resources) as HymnResourceKey[]).find((k) => prevSong.resources[k]?.url);
      if (fallbackKey) handlePlayResource(prevSong, fallbackKey);
    }
  };

  // Sync directly from GitHub Repository (mef-2026-repertory)
  const handleSyncGitHub = async () => {
    setIsSyncingGitHub(true);
    const result = await GitHubApiService.syncRepositorySongs(DEFAULT_GITHUB_CONFIG);
    setIsSyncingGitHub(false);

    if (result.success && result.songs && result.songs.length > 0) {
      setSongs(result.songs);
      if (result.lyricsFile) {
        setLyricsFile(result.lyricsFile);
      }
      setSyncToast({
        type: 'success',
        message: `¡Repertorio actualizado desde mef-2026-repertory! (${result.songs.length} obras)`,
      });
    } else {
      setSyncToast({
        type: 'error',
        message: result.message || 'Error al conectar con GitHub.',
      });
    }

    setTimeout(() => {
      setSyncToast(null);
    }, 4500);
  };

  // Auto-sync on startup directly from mef-2026-repertory
  useEffect(() => {
    GitHubApiService.syncRepositorySongs(DEFAULT_GITHUB_CONFIG).then((res) => {
      if (res.success && res.songs && res.songs.length > 0) {
        setSongs(res.songs);
      }
      if (res.lyricsFile) {
        setLyricsFile(res.lyricsFile);
      }
    });
  }, []);

  // Direct Download Lyrics action from the Menu
  const handleDownloadLyrics = async () => {
    const fileToDownload = lyricsFile || {
      fileName: 'LETRAS MEF 2026.pdf',
      path: 'Letras/LETRAS MEF 2026.pdf',
      rawUrl: `https://raw.githubusercontent.com/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.owner)}/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.repo)}/${encodeURIComponent(DEFAULT_GITHUB_CONFIG.branch)}/Letras/LETRAS%20MEF%202026.pdf`,
      extension: 'pdf',
    };

    setIsDownloadingLyrics(true);
    setSyncToast({
      type: 'success',
      message: `Iniciando descarga de ${fileToDownload.fileName}...`,
    });

    try {
      await GitHubApiService.downloadLyricsFile(fileToDownload, DEFAULT_GITHUB_CONFIG.token);
      setSyncToast({
        type: 'success',
        message: `¡${fileToDownload.fileName} descargado con éxito!`,
      });
    } catch (err: any) {
      setSyncToast({
        type: 'error',
        message: `Error al descargar letras: ${err.message}`,
      });
    } finally {
      setIsDownloadingLyrics(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Calculate Statistics: shows songs that have audios available
  const stats = useMemo(() => {
    let completeCount = 0;
    let withAudioCount = 0;
    songs.forEach((s) => {
      const keys = Object.keys(s.resources) as HymnResourceKey[];
      const count = keys.filter((k) => s.resources[k]?.url).length;
      if (count === 6) completeCount++;
      if (count > 0) withAudioCount++;
    });
    return {
      total: songs.length,
      complete: completeCount,
      withAudio: withAudioCount,
      incomplete: songs.length - completeCount,
    };
  }, [songs]);

  // Filtered Songs by search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter((s) => {
      const matchNum = s.number.toString() === q;
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchComp = s.composer?.toLowerCase().includes(q) || false;
      return matchNum || matchTitle || matchComp;
    });
  }, [songs, searchQuery]);

  return (
    <div className={`min-h-screen bg-[#f7f8fa] text-neutral-900 flex flex-col font-sans ${currentSong ? 'pb-32' : 'pb-16'}`}>
      {/* Hidden audio element (Always kept in DOM so audio never stops) */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          if (!isLooping) handleNextTrack();
        }}
      />

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Mobile Bar with Search and Menu to download lyrics */}
        <MobileTopBar
          searchOpen={searchOpen}
          onToggleSearch={() => {
            setSearchOpen(!searchOpen);
            if (searchOpen) setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onDownloadLyrics={handleDownloadLyrics}
          isDownloadingLyrics={isDownloadingLyrics}
          lyricsFileName={lyricsFile?.fileName || 'LETRAS MEF 2026.pdf'}
        />

        {/* Sync Toast Notification */}
        {syncToast && (
          <div className="fixed top-16 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-top-3 fade-in duration-200">
            <div
              className={`p-3.5 rounded-2xl shadow-sublime-card text-xs flex items-center space-x-2.5 ${
                syncToast.type === 'success'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-rose-900 text-white'
              }`}
            >
              {syncToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="font-medium flex-1">{syncToast.message}</span>
            </div>
          </div>
        )}

        {/* Main Content Area - Repertorio */}
        <main className="flex-1 max-w-md sm:max-w-2xl w-full mx-auto px-4 pt-2 pb-24 space-y-4">
          {/* Album Hero Card */}
          <AlbumHeroCard
            songs={songs}
            onOpenPlayRepertoire={() => setIsPlayRepertoireOpen(true)}
            stats={stats}
            continuousVoice={continuousVoice}
            onSyncGitHub={handleSyncGitHub}
            isSyncingGitHub={isSyncingGitHub}
            isPlaying={isPlaying}
          />

          {/* Song List Items with available voices */}
          <div className="space-y-3">
            {filteredSongs.map((song, index) => (
              <SongListItem
                key={song.id}
                song={song}
                index={index}
                currentPlaying={
                  currentSong?.id === song.id && currentResourceKey
                    ? {
                        songId: song.id,
                        resourceKey: currentResourceKey,
                        isPlaying,
                      }
                    : null
                }
                onSelectSongBig={handleSelectSongBig}
                cachedUrls={cachedUrls}
              />
            ))}
          </div>
        </main>

        {/* Floating Dark Mini-Player Pill at 100% Footer Width when playing */}
        <MiniPlayerDock
          currentSong={currentSong}
          currentResourceKey={currentResourceKey}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
          isCached={!!(activeResource?.url && cachedUrls.has(activeResource.url))}
        />
      </div>

      {/* Full "Now Playing" Modal at 100% full screen with automatic caching and downloads */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        currentSong={currentSong}
        currentResourceKey={currentResourceKey}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStop={handleStop}
        onSelectResource={(s, k) => handlePlayResource(s, k)}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        currentTime={currentTime}
        duration={duration}
        onSeek={(t) => {
          if (audioRef.current) audioRef.current.currentTime = t;
        }}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        playbackRate={playbackRate}
        onChangeSpeed={(rate) => setPlaybackRate(rate)}
        isCached={!!(activeResource?.url && cachedUrls.has(activeResource.url))}
        lyricsFile={lyricsFile}
        gitHubToken={gitHubConfig.token}
      />

      {/* Select Voice for Repertoire Playback Modal */}
      <PlayRepertoireModal
        isOpen={isPlayRepertoireOpen}
        onClose={() => setIsPlayRepertoireOpen(false)}
        onSelectVoiceToPlayAll={handleSelectVoiceToPlayAll}
        completeSongsCount={stats.withAudio || stats.total}
      />

      {/* PWA Install / Home Screen Shortcut Prompt Popup */}
      <PWAInstallModal />
    </div>
  );
}
