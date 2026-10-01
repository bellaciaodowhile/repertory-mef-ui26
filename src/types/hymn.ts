export type HymnResourceKey = 'demo' | 'pista' | 'soprano' | 'contralto' | 'tenor' | 'bajo';

export interface ResourceMeta {
  key: HymnResourceKey;
  name: string;
  shortName: string;
  role: string;
  colorClass: string;
  activeBgClass: string;
  badgeClass: string;
}

export interface SongResource {
  url: string;
  fileName?: string;
  fileSize?: number; // bytes
  duration?: number; // seconds
  lastUpdated?: string;
  isCustomBlob?: boolean;
}

export interface SongItem {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  category: string;
  keySignature?: string;
  tempo?: string;
  composer?: string;
  lyrics?: string;
  lyricsFileName?: string;
  notes?: string;
  coverImage?: string;
  resources: {
    demo: SongResource | null;
    pista: SongResource | null;
    soprano: SongResource | null;
    contralto: SongResource | null;
    tenor: SongResource | null;
    bajo: SongResource | null;
  };
}

// Backward-compat alias
export type Hymn = SongItem;

export interface LyricsFileItem {
  fileName: string;
  path: string;
  rawUrl: string;
  blobUrl?: string;
  fileSize?: number;
  extension?: string;
  lastUpdated?: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  filePath: string;
}

export const RESOURCE_METAS: ResourceMeta[] = [
  {
    key: 'demo',
    name: 'Demo',
    shortName: 'Demo',
    role: 'Coral Completo',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
  {
    key: 'pista',
    name: 'Pista',
    shortName: 'Pista',
    role: 'Instrumental',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
  {
    key: 'soprano',
    name: 'Soprano',
    shortName: 'SOP',
    role: 'Voz 1 (Aguda)',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
  {
    key: 'contralto',
    name: 'Contralto',
    shortName: 'CON',
    role: 'Voz 2 (Media)',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
  {
    key: 'tenor',
    name: 'Tenor',
    shortName: 'TEN',
    role: 'Voz 3 (Tenor)',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
  {
    key: 'bajo',
    name: 'Bajo',
    shortName: 'BAJO',
    role: 'Voz 4 (Bajo)',
    colorClass: 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800',
    activeBgClass: 'bg-neutral-900 text-white',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
];
