import React, { useState, useEffect } from 'react';
import { SongItem, GitHubConfig, HymnResourceKey } from '../types/hymn';
import { GitHubApiService, GitHubSyncResult } from '../services/githubApi';
import { AudioCacheService } from '../services/audioCache';
import {
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Github,
  HardDrive,
  RefreshCw,
  Eye,
  EyeOff,
  FolderTree,
  ExternalLink,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: SongItem[];
  onSaveSongs: (newSongs: SongItem[]) => void;
  gitHubConfig: GitHubConfig;
  onSaveGitHubConfig: (config: GitHubConfig) => void;
  onTriggerSync?: () => Promise<void>;
}

const DEFAULT_PIN = '456123';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  songs,
  onSaveSongs,
  gitHubConfig,
  onSaveGitHubConfig,
  onTriggerSync,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // GitHub Config Form
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(gitHubConfig);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; result?: GitHubSyncResult } | null>(null);

  // Cache stats
  const [cacheSize, setCacheSize] = useState<string>('0 MB');
  const [cachedItemsCount, setCachedItemsCount] = useState<number>(0);

  useEffect(() => {
    setGhConfig(gitHubConfig);
  }, [gitHubConfig]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadCacheStats();
    }
  }, [isOpen, isAuthenticated]);

  const loadCacheStats = async () => {
    const keys = await AudioCacheService.getAllCachedKeys();
    setCachedItemsCount(keys.size);
    const estMb = (keys.size * 3.5).toFixed(1);
    setCacheSize(`${estMb} MB`);
  };

  if (!isOpen) return null;

  // PIN Authentication
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPinError(null);
    } else {
      setPinError('PIN incorrecto.');
    }
  };

  // Sync from GitHub
  const handleSyncFromGitHub = async () => {
    setSyncStatus({ loading: true });
    // Save config first
    onSaveGitHubConfig(ghConfig);

    const result = await GitHubApiService.syncRepositorySongs(ghConfig);
    setSyncStatus({ loading: false, result });

    if (result.success && result.songs && result.songs.length > 0) {
      onSaveSongs(result.songs);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (window.confirm('¿Deseas vaciar todos los audios guardados en caché local?')) {
      await AudioCacheService.clearAll();
      await loadCacheStats();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Conexión con Repositorio GitHub</h2>
              <p className="text-xs text-neutral-400">
                Sincronización automática de carpetas y pistas de audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-3xl bg-neutral-100 flex items-center justify-center mb-4 text-neutral-800">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Acceso de Configuración</h3>
            <p className="text-xs text-neutral-500 mb-6 max-w-xs">
              Ingresa el código PIN para configurar el repositorio de GitHub.
            </p>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Código PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-xl tracking-widest py-3 px-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-mono"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-500 font-medium mt-2 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {pinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-sublime-button"
              >
                Ingresar
              </button>
            </form>
          </div>
        ) : (
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
            {/* Guide on structure in GitHub */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80">
              <div className="flex items-center space-x-2 text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                <FolderTree className="w-4 h-4 text-neutral-700" />
                <span>Estructura que debe tener tu Repositorio en GitHub</span>
              </div>
              <p className="text-xs text-neutral-600 mb-3">
                Crea una carpeta por cada canción. Dentro coloca los 6 archivos de audio con sus nombres correspondientes:
              </p>
              <div className="bg-neutral-900 text-neutral-200 font-mono text-[11px] p-3 rounded-xl overflow-x-auto leading-relaxed">
                <div>📁 <strong className="text-white">01 - A Través de los Años/</strong></div>
                <div className="pl-4">├── 🎵 Demo.mp3</div>
                <div className="pl-4">├── 🎵 Pista.mp3</div>
                <div className="pl-4">├── 🎵 Soprano.mp3</div>
                <div className="pl-4">├── 🎵 Contralto.mp3</div>
                <div className="pl-4">├── 🎵 Tenor.mp3</div>
                <div className="pl-4">└── 🎵 Bajo.mp3</div>
                <div className="mt-1.5">📁 <strong className="text-white">02 - Grande es Dios/</strong></div>
                <div className="mt-2 pt-2 border-t border-neutral-800">
                  <div className="text-amber-300 font-bold">📁 Letras/ <span className="text-[10px] text-neutral-400 font-sans font-normal">(Carpeta general de letras)</span></div>
                  <div className="pl-4 text-emerald-400">└── 📄 Letras_Completas.pdf <span className="text-[10px] text-neutral-400 font-sans font-normal">(o .txt / .docx)</span></div>
                </div>
              </div>
            </div>

            {/* GitHub Credentials Form */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Datos del Repositorio en GitHub
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Usuario / Organización
                  </label>
                  <input
                    type="text"
                    placeholder="ej. thushakk4 o tu-usuario"
                    value={ghConfig.owner}
                    onChange={(e) => setGhConfig({ ...ghConfig, owner: e.target.value })}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nombre del Repositorio
                  </label>
                  <input
                    type="text"
                    placeholder="ej. repertorio-coral-2026"
                    value={ghConfig.repo}
                    onChange={(e) => setGhConfig({ ...ghConfig, repo: e.target.value })}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Rama (Branch)
                  </label>
                  <input
                    type="text"
                    placeholder="main o master"
                    value={ghConfig.branch || 'main'}
                    onChange={(e) => setGhConfig({ ...ghConfig, branch: e.target.value })}
                    className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Token Personal (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      placeholder="ghp_... (solo si el repo es privado)"
                      value={ghConfig.token || ''}
                      onChange={(e) => setGhConfig({ ...ghConfig, token: e.target.value })}
                      className="w-full text-xs py-2.5 pl-3.5 pr-10 rounded-xl bg-neutral-50 border border-neutral-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sync Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSyncFromGitHub}
                  disabled={syncStatus?.loading || !ghConfig.owner || !ghConfig.repo}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase shadow-sublime-button transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus?.loading ? 'animate-spin' : ''}`} />
                  <span>
                    {syncStatus?.loading ? 'Sincronizando desde GitHub...' : 'Sincronizar y Cargar Canciones'}
                  </span>
                </button>
              </div>

              {/* Status Message */}
              {syncStatus?.result && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-start space-x-2.5 ${
                    syncStatus.result.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {syncStatus.result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{syncStatus.result.message}</p>
                    {syncStatus.result.success && syncStatus.result.totalFolders !== undefined && (
                      <p className="mt-1 text-[11px] opacity-90">
                        {syncStatus.result.totalFolders} obras sincronizadas ({syncStatus.result.completeCount} completas 6/6 disponibles para reproducir).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Offline Cache Status */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-800 block">Caché Local Offline</span>
                <span className="text-[11px] text-neutral-400">
                  {cachedItemsCount} archivos de audio guardados ({cacheSize})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearCache}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 text-xs font-semibold hover:bg-neutral-50 transition-colors"
              >
                Vaciar Caché
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
