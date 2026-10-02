import React, { useState } from 'react';
import { Search, Music, X, Download, Menu } from 'lucide-react';

interface MobileTopBarProps {
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onDownloadLyrics: () => void;
  isDownloadingLyrics?: boolean;
  lyricsFileName?: string;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  searchOpen,
  onToggleSearch,
  searchQuery,
  onSearchChange,
  onDownloadLyrics,
  isDownloadingLyrics = false,
  lyricsFileName = 'LETRAS MEF 2026.pdf',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 bg-[#f7f8fa]/95 backdrop-blur-md px-4 py-3 transition-all border-b border-neutral-200/50">
      <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-between gap-2.5">
        {searchOpen ? (
          <div className="flex-1 flex items-center bg-white rounded-2xl px-3.5 py-2 shadow-sublime animate-in fade-in duration-150">
            <Search className="w-4 h-4 text-neutral-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por título, número o tono..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 focus:outline-none placeholder-neutral-400"
            />
            <button
              onClick={onToggleSearch}
              className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Logo and App Title */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-neutral-900 tracking-tight block truncate">
                  Música en Familia
                </span>
                <span className="text-[10px] text-neutral-400 font-medium block truncate">
                  Repertorio Coral 2026
                </span>
              </div>
            </div>

            {/* Top Bar Actions: Search + Menu */}
            <div className="flex items-center space-x-1.5 flex-shrink-0 relative">
              {/* Botón directo de búsqueda */}
              <button
                type="button"
                onClick={onToggleSearch}
                className="p-2 rounded-xl bg-white text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors cursor-pointer border border-neutral-200/60"
                title="Buscar canciones"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Botón de Menú */}
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-white text-neutral-800 hover:text-neutral-900 shadow-sm transition-colors cursor-pointer border border-neutral-200/60 font-semibold text-xs"
                title="Menú de opciones"
              >
                <Menu className="w-4 h-4 text-neutral-700" />
                <span className="hidden sm:inline">Menú</span>
              </button>

              {/* Dropdown del Menú */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-64 bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-100 p-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 mb-1">
                      Menú
                    </div>

                    {/* BOTÓN EN EL MENÚ QUE DESCARGA EL DOCUMENTO */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDownloadLyrics();
                      }}
                      disabled={isDownloadingLyrics}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-50 active:bg-neutral-100 text-left text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
                    >
                      <Download className={`w-4 h-4 text-neutral-700 flex-shrink-0 ${isDownloadingLyrics ? 'animate-bounce' : ''}`} />
                      <div className="min-w-0">
                        <span className="block truncate">Descargar Letras (PDF)</span>
                        <span className="text-[10px] text-neutral-400 block truncate font-mono">
                          {lyricsFileName}
                        </span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
