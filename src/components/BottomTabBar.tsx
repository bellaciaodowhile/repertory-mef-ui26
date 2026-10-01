import React from 'react';

interface BottomTabBarProps {
  currentTab: 'home' | 'lyrics';
  onChangeTab: (tab: 'home' | 'lyrics') => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onChangeTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-neutral-100 py-3 px-6 shadow-sublime">
      <div className="max-w-xs mx-auto flex items-center justify-center p-1 bg-neutral-100 rounded-2xl">
        <button
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            currentTab === 'home'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 bg-transparent'
          }`}
        >
          Repertorio
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('lyrics')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            currentTab === 'lyrics'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 bg-transparent'
          }`}
        >
          Letras
        </button>
      </div>
    </div>
  );
};
