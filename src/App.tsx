import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SongItem, GitHubConfig, HymnResourceKey, LyricsFileItem } from './types/hymn';
import { createInitialHymns } from './data/initialHymns';
import { AudioCacheService } from './services/audioCache';
import { GitHubApiService } from './services/githubApi';
import { MobileTopBar } from './components/MobileTopBar';
import { AlbumHeroCard } from './components/AlbumHeroCard';
import { SongListItem } from './components/SongListItem';
import { MiniPlayerDock } from './components/MiniPlayerDock';
import { NowPlayingModal } from './components/NowPlayingModal';
import { AdminModal } from './components/AdminModal';
import { PlayRepertoireModal } from './components/PlayRepertoireModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY_SONGS = 'musica_en_familia_repertorio_2026_v5';
const STORAGE_KEY_GH = 'musica_en_familia_github_config_v5';
const STORAGE_KEY_LYRICS_FILE = 'musica_en_familia_lyrics_file_v2';

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

  const [gitHubConfig, setGitHubConfig] = useState<GitHubConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GH);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      owner: '',
      repo: '',
      branch: 'main',
      token: '',
      filePath: '',
    };
  });

  // Global lyrics file from "Letras" folder in GitHub
  const [lyricsFile, setLyricsFile] = useState<LyricsFileItem | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LYRICS_FILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Admin Session State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
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
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
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

  // Persist GitHub config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GH, JSON.stringify(gitHubConfig));
    } catch {}
  }, [gitHubConfig]);

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

  // Sync directly from GitHub Repository
  const handleSyncGitHub = async () => {
    if (!gitHubConfig.owner || !gitHubConfig.repo) {
      setIsAdminOpen(true);
      return;
    }

    setIsSyncingGitHub(true);
    const result = await GitHubApiService.syncRepositorySongs(gitHubConfig);
    setIsSyncingGitHub(false);

    if (result.success && result.songs && result.songs.length > 0) {
      setSongs(result.songs);
      if (result.lyricsFile) {
        setLyricsFile(result.lyricsFile);
      }
      setSyncToast({
        type: 'success',
        message: `¡Sincronizado! ${result.songs.length} obras leídas desde GitHub.${result.lyricsFile ? ' Archivo de letras actualizado.' : ''}`,
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

  // Auto-sync on startup if GitHub config exists
  useEffect(() => {
    if (gitHubConfig.owner && gitHubConfig.repo) {
      GitHubApiService.syncRepositorySongs(gitHubConfig).then((res) => {
        if (res.success && res.songs && res.songs.length > 0) {
          setSongs(res.songs);
        }
        if (res.lyricsFile) {
          setLyricsFile(res.lyricsFile);
        }
      });
    }
  }, [gitHubConfig.owner, gitHubConfig.repo, gitHubConfig.branch]);

  // Direct Download Lyrics action from the Menu
  const handleDownloadLyrics = async () => {
    const fileToDownload = lyricsFile || {
      fileName: 'LETRAS MEF 2026.pdf',
      path: 'Letras/LETRAS MEF 2026.pdf',
      rawUrl: gitHubConfig.owner && gitHubConfig.repo
        ? `https://raw.githubusercontent.com/${encodeURIComponent(gitHubConfig.owner)}/${encodeURIComponent(gitHubConfig.repo)}/${encodeURIComponent(gitHubConfig.branch || 'main')}/Letras/LETRAS%20MEF%202026.pdf`
        : '',
      extension: 'pdf',
    };

    if (!fileToDownload.rawUrl) {
      setSyncToast({
        type: 'error',
        message: 'No se encontró la dirección de descarga del archivo de letras en GitHub.',
      });
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }

    setIsDownloadingLyrics(true);
    setSyncToast({
      type: 'success',
      message: `Iniciando descarga de ${fileToDownload.fileName}...`,
    });

    try {
      await GitHubApiService.downloadLyricsFile(fileToDownload, gitHubConfig.token);
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

  // =========================================================================
  // SECRET RHYTHM DETECTOR FOR ADMIN:
  // "corchea, dos semicorcheas, silencio de corchea y dos corcheas en un tiempo moderado"
  // =========================================================================
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const handleGlobalTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const now = performance.now();
      const prevTaps = tapTimesRef.current;

      // Reset sequence if inactive for more than 2.8 seconds
      if (prevTaps.length > 0 && now - prevTaps[prevTaps.length - 1] > 2800) {
        tapTimesRef.current = [now];
        return;
      }

      prevTaps.push(now);

      // Keep only last 5 taps
      if (prevTaps.length > 5) {
        prevTaps.shift();
      }

      if (prevTaps.length === 5) {
        const [t0, t1, t2, t3, t4] = prevTaps;
        const i0 = t1 - t0; // Corchea
        const i1 = t2 - t1; // Semicorchea
        const i2 = t3 - t2; // Silencio de corchea
        const i3 = t4 - t3; // Corchea
        const total = i0 + i1 + i2 + i3;

        // Moderate tempo constraints (total duration ~800ms to ~3800ms)
        const isModerateTempo = total >= 800 && total <= 3800;

        const isCorchea1 = i0 >= 140 && i0 <= 850;
        const isSemicorchea = i1 >= 70 && i1 <= 500 && i1 <= i0 * 0.95;
        const isSilencio = i2 >= 220 && i2 <= 1400 && i2 >= i1 * 1.15;
        const isCorchea2 = i3 >= 140 && i3 <= 850;

        if (isModerateTempo && isCorchea1 && isSemicorchea && isSilencio && isCorchea2) {
          tapTimesRef.current = [];
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 40, 50]);
          }
          setIsAdminOpen(true);
        }
      }
    };

    window.addEventListener('pointerdown', handleGlobalTap);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalTap);
    };
  }, []);

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
          onOpenAdmin={() => setIsAdminOpen(true)}
          isAdmin={isAdmin}
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
            gitHubConfig={gitHubConfig}
            onSyncGitHub={handleSyncGitHub}
            isSyncingGitHub={isSyncingGitHub}
            onOpenAdmin={() => setIsAdminOpen(true)}
            isAdmin={isAdmin}
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

      {/* Admin Panel Modal (GitHub Repository Connection Manager) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          setIsAdmin(sessionStorage.getItem('admin_authenticated') === 'true');
        }}
        songs={songs}
        onSaveSongs={(newSongs) => setSongs(newSongs)}
        gitHubConfig={gitHubConfig}
        onSaveGitHubConfig={(newConfig) => setGitHubConfig(newConfig)}
        onTriggerSync={handleSyncGitHub}
      />

      {/* PWA Install / Home Screen Shortcut Prompt Popup */}
      <PWAInstallModal />
    </div>
  );
}
