import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Share,
  PlusSquare,
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  MoreVertical,
  Globe,
  Music,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY_DONT_SHOW = 'pwa_prompt_dont_show_again_v1';

export const PWAInstallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed as an app)
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(standaloneCheck);

    if (standaloneCheck) {
      return;
    }

    // Check if user previously marked "No volver a mostrar"
    const isDismissed = localStorage.getItem(STORAGE_KEY_DONT_SHOW) === 'true';
    if (isDismissed) {
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEY_DONT_SHOW, 'true');
      setTimeout(() => setIsOpen(false), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show popup shortly after open (850ms)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 850);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen || isStandalone) return null;

  const handleClose = (persistDontShow = false) => {
    if (dontShowAgain || persistDontShow) {
      try {
        localStorage.setItem(STORAGE_KEY_DONT_SHOW, 'true');
      } catch {}
    }
    setIsOpen(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        try {
          localStorage.setItem(STORAGE_KEY_DONT_SHOW, 'true');
        } catch {}
        setTimeout(() => setIsOpen(false), 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 duration-300 border border-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Header with Musical Note App Icon */}
        <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white p-6 pb-5">
          <button
            onClick={() => handleClose(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5">
            {/* Real Musical Note App Icon Preview */}
            <div className="w-14 h-14 rounded-2xl bg-neutral-950 p-1.5 shadow-lg flex-shrink-0 border border-amber-400/30 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="Icono Nota Musical"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Acceso Directo</span>
              </span>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Instalar Música en Familia
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Icono de nota musical en tu pantalla de inicio
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {installedSuccess ? (
            <div className="py-6 text-center space-y-2 text-emerald-600">
              <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-neutral-900">¡Instalación Iniciada!</h4>
              <p className="text-xs text-neutral-500">
                La aplicación con el icono de nota musical ya se está añadiendo a tu pantalla de inicio.
              </p>
            </div>
          ) : (
            <>
              {/* Value propositions */}
              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 text-xs text-neutral-600">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-neutral-900 block font-semibold">
                      Icono de Nota Musical en tu celular
                    </strong>
                    Aparecerá en tu pantalla de inicio como cualquier otra app para abrirla directamente.
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs text-neutral-600">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-neutral-900 block font-semibold">
                      Descargas y 3 puntos (⋮) integrados
                    </strong>
                    Podrás descargar cada voz (Soprano, Tenor, etc.) con sus botones y menú de 3 puntos.
                  </div>
                </div>
              </div>

              {/* Instructions based on platform */}
              {isIOS ? (
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-800">
                    <Smartphone className="w-4 h-4 text-neutral-700" />
                    <span>Pasos en iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="space-y-2 text-neutral-600 text-[11px] list-decimal list-inside pl-0.5">
                    <li className="leading-snug">
                      Toca el botón <strong className="text-neutral-900 inline-flex items-center"><Share className="w-3 h-3 inline mx-1" /> Compartir</strong> en la barra inferior de Safari.
                    </li>
                    <li className="leading-snug">
                      Desliza hacia abajo y pulsa <strong className="text-neutral-900 inline-flex items-center"><PlusSquare className="w-3 h-3 inline mx-1" /> Añadir a la pantalla de inicio</strong>.
                    </li>
                    <li className="leading-snug">
                      Confirma tocando <strong className="text-neutral-900">Añadir</strong> arriba a la derecha.
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                /* Native prompt button for Android / Chrome */
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wider uppercase shadow-sublime-button transition-all active:scale-[0.98] cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4 text-amber-400" />
                  <span>Crear Acceso Directo Ahora</span>
                </button>
              ) : (
                /* Android / Chrome manual instructions with helper for missing 3 dots */
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-3 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-800">
                    <Smartphone className="w-4 h-4 text-neutral-700" />
                    <span>¿Cómo agregarlo a tu celular?</span>
                  </div>

                  <div className="space-y-2 text-neutral-600 text-[11px]">
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-neutral-900">1.</span>
                      <span>
                        En Chrome, toca los <strong className="text-neutral-900 inline-flex items-center"><MoreVertical className="w-3 h-3 inline" /> 3 puntos</strong> arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
                      </span>
                    </div>

                    {/* Crucial tip for users whose in-app browser hides the 3 dots */}
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 flex items-start space-x-2 mt-1">
                      <Globe className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <strong className="block font-semibold">¿No te salen los 3 puntos?</strong>
                        Si abriste el enlace desde <strong>WhatsApp o redes sociales</strong>, toca el icono de menú del chat y elige <strong className="underline">"Abrir en Chrome"</strong> o "Abrir en el navegador" para que aparezcan los 3 puntos y la opción de instalar.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Note about downloading songs */}
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center space-x-2.5 text-xs text-neutral-600">
                <Music className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                <span className="text-[11px] leading-tight">
                  Para descargar canciones individuales, toca cualquier obra y usa el icono de <strong className="text-neutral-900">descarga</strong> o los <strong className="text-neutral-900">3 puntos (⋮)</strong> que ahora están al lado de cada voz.
                </span>
              </div>

              {/* "No volver a mostrar" Checkbox */}
              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none text-xs text-neutral-600 hover:text-neutral-900">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-neutral-900 transition-all cursor-pointer"
                  />
                  <span>No volver a mostrar este aviso</span>
                </label>
              </div>

              {/* Footer actions */}
              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  No volver a mostrar
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer text-center shadow-sm"
                >
                  Entendido
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
