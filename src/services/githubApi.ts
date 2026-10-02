import { GitHubConfig, SongItem, HymnResourceKey, LyricsFileItem } from '../types/hymn';

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  songs?: SongItem[];
  branch?: string;
  totalFolders?: number;
  completeCount?: number;
  lyricsFile?: LyricsFileItem | null;
}

export const GitHubApiService = {
  /**
   * Test connection to GitHub repository
   */
  async testConnection(config: GitHubConfig): Promise<{ success: boolean; message: string; defaultBranch?: string }> {
    if (!config.owner || !config.repo) {
      return {
        success: false,
        message: 'Faltan campos requeridos: Propietario / Usuario y Nombre del Repositorio.',
      };
    }

    const owner = encodeURIComponent(config.owner.trim());
    const repo = encodeURIComponent(config.repo.trim());
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (config.token && config.token.trim()) {
      headers.Authorization = `Bearer ${config.token.trim()}`;
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: `No se encontró el repositorio "${config.owner}/${config.repo}". Si es privado, asegúrate de ingresar un Token de GitHub con permisos de lectura.`,
          };
        }
        if (response.status === 401) {
          return {
            success: false,
            message: 'Token de GitHub inválido o expirado (401 Unauthorized).',
          };
        }
        return {
          success: false,
          message: `Error al conectar con GitHub: HTTP ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `¡Conexión exitosa con "${data.full_name}"! Rama principal: ${data.default_branch}`,
        defaultBranch: data.default_branch,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error de red al consultar GitHub: ${err.message}`,
      };
    }
  },

  /**
   * Read the repository tree directly from GitHub.
   * Expects folders where each folder is named after a song, and inside it contains:
   * Demo, Pista, Soprano, Contralto, Tenor, Bajo (plus optional lyrics or cover image).
   */
  async syncRepositorySongs(config: GitHubConfig): Promise<GitHubSyncResult> {
    if (!config.owner || !config.repo) {
      return {
        success: false,
        message: 'Indica el usuario/organización y el nombre del repositorio de GitHub.',
      };
    }

    const owner = config.owner.trim();
    const repo = config.repo.trim();
    let branch = config.branch && config.branch.trim() ? config.branch.trim() : 'main';

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (config.token && config.token.trim()) {
      headers.Authorization = `Bearer ${config.token.trim()}`;
    }

    try {
      // 1. Fetch git tree recursively
      let treeUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
      let res = await fetch(treeUrl, { headers });

      // If branch 'main' returned 404, try 'master'
      if (!res.ok && res.status === 404 && branch === 'main') {
        branch = 'master';
        treeUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
        res = await fetch(treeUrl, { headers });
      }

      if (!res.ok) {
        if (res.status === 404) {
          return {
            success: false,
            message: `No se encontró el repositorio o la rama "${branch}" en GitHub. Si es privado, ingresa un Token de GitHub.`,
          };
        }
        if (res.status === 403) {
          return {
            success: false,
            message: 'Límite de solicitudes de la API de GitHub alcanzado. Agrega un Token personal en la configuración para tener hasta 5,000 consultas por hora.',
          };
        }
        return {
          success: false,
          message: `Error al leer el repositorio de GitHub: HTTP ${res.status} ${res.statusText}`,
        };
      }

      const treeData = await res.json();
      const tree: GitHubTreeItem[] = treeData.tree || [];

      if (tree.length === 0) {
        return {
          success: false,
          message: `El repositorio "${owner}/${repo}" está vacío en la rama "${branch}". Añade carpetas con canciones para comenzar.`,
        };
      }

      // Group files by song folder
      // e.g. path: "01 - A Través de los Años/Demo.mp3" -> folder: "01 - A Través de los Años"
      interface FolderGroup {
        folderName: string;
        files: GitHubTreeItem[];
      }

      const folderMap = new Map<string, FolderGroup>();
      let detectedLyricsFile: LyricsFileItem | null = null;

      for (const item of tree) {
        if (item.type !== 'blob') continue;
        // Skip root hidden files or git files
        if (item.path.startsWith('.') || item.path.includes('/.')) continue;

        const parts = item.path.split('/');
        const fileName = parts[parts.length - 1];
        const lowerFileName = fileName.toLowerCase();

        // Check if this file is the unified lyrics document (e.g. LETRAS MEF 2026.pdf or inside Letras folder)
        const cleanParentFolder = parts.length >= 2 ? parts[parts.length - 2].trim().toLowerCase() : '';
        const isMefLyrics =
          lowerFileName === 'letras mef 2026.pdf' ||
          lowerFileName.includes('letras mef') ||
          cleanParentFolder === 'letras' ||
          cleanParentFolder === 'letra';

        if (isMefLyrics) {
          if (lowerFileName !== '.gitkeep' && lowerFileName !== 'readme.md') {
            const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${item.path.split('/').map(encodeURIComponent).join('/')}`;
            const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'pdf';

            detectedLyricsFile = {
              fileName: fileName,
              path: item.path,
              rawUrl: rawUrl,
              blobUrl: item.url,
              fileSize: item.size,
              extension: ext,
              lastUpdated: new Date().toISOString(),
            };
            // Do not treat as song folder
            continue;
          }
        }

        // Must be inside a song folder (parts.length >= 2)
        if (parts.length < 2) continue;

        // Folder is the direct parent directory of the file
        const folderName = parts[parts.length - 2];

        // Ignore readme at folder level if not lyrics
        if (fileName.toLowerCase() === 'readme.md' && parts.length === 2) {
          // ignore repo readme
          continue;
        }

        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, { folderName, files: [] });
        }
        folderMap.get(folderName)!.files.push(item);
      }

      if (folderMap.size === 0) {
        return {
          success: false,
          message: `No se encontraron carpetas de canciones en "${owner}/${repo}". Recuerda crear una carpeta por canción y dentro colocar los audios: Demo, Pista, Soprano, Contralto, Tenor, Bajo.`,
        };
      }

      // Parse each folder into a SongItem
      const songs: SongItem[] = [];
      let autoIndex = 1;

      for (const [folderName, group] of folderMap.entries()) {
        // Parse number and clean title from folderName
        // e.g., "01 - A Través de los Años" -> 1, "A Través de los Años"
        // e.g., "02. Grande es Dios" -> 2, "Grande es Dios"
        let songNumber = autoIndex;
        let songTitle = folderName;

        const numberPrefixMatch = folderName.match(/^(\d+)[\s._-]+(.+)$/);
        if (numberPrefixMatch) {
          songNumber = parseInt(numberPrefixMatch[1], 10);
          songTitle = numberPrefixMatch[2].trim();
        } else {
          autoIndex++;
        }

        const resources: SongItem['resources'] = {
          demo: null,
          pista: null,
          soprano: null,
          contralto: null,
          tenor: null,
          bajo: null,
        };

        let coverImage: string | undefined = undefined;
        let lyricsContent: string | undefined = undefined;
        let lyricsPath: string | undefined = undefined;
        let lyricsFileUrl: string | undefined = undefined;

        // Classify each file in the folder
        for (const file of group.files) {
          const fileName = file.path.split('/').pop() || '';
          const lowerName = fileName.toLowerCase();

          // Construct raw streaming URL
          const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${file.path.split('/').map(encodeURIComponent).join('/')}`;

          // Check for voice audio files
          const isAudio =
            lowerName.endsWith('.mp3') ||
            lowerName.endsWith('.wav') ||
            lowerName.endsWith('.m4a') ||
            lowerName.endsWith('.ogg') ||
            lowerName.endsWith('.aac') ||
            lowerName.endsWith('.flac') ||
            !fileName.includes('.'); // File named simply "Demo", "Pista", etc.

          if (isAudio) {
            let matchedKey: HymnResourceKey | null = null;

            if (lowerName.includes('demo')) {
              matchedKey = 'demo';
            } else if (lowerName.includes('pista') || lowerName.includes('instrumental') || lowerName.includes('karaoke')) {
              matchedKey = 'pista';
            } else if (lowerName.includes('soprano') || lowerName.includes('sop')) {
              matchedKey = 'soprano';
            } else if (lowerName.includes('contralto') || lowerName.includes('con') || lowerName.includes('alto')) {
              matchedKey = 'contralto';
            } else if (lowerName.includes('tenor') || lowerName.includes('ten')) {
              matchedKey = 'tenor';
            } else if (lowerName.includes('bajo') || lowerName.includes('bass') || lowerName.includes('baj')) {
              matchedKey = 'bajo';
            }

            if (matchedKey) {
              resources[matchedKey] = {
                url: rawUrl,
                fileName: fileName,
                fileSize: file.size,
                lastUpdated: new Date().toISOString(),
              };
            }
          }

          // Check for lyrics text file (.txt prioritized as requested by user)
          if (
            lowerName.endsWith('.txt') ||
            lowerName.endsWith('.md') ||
            lowerName.includes('letra') ||
            lowerName.includes('lyric')
          ) {
            lyricsPath = rawUrl;
            // Also store api blob url for private repo fetching if available
            if (file.url) {
              lyricsFileUrl = file.url;
            }
          }

          // Check for cover image file
          if (
            lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.webp')
          ) {
            coverImage = rawUrl;
          }
        }

        // If lyrics file was found, fetch its text content asynchronously
        if (lyricsPath || lyricsFileUrl) {
          try {
            // First try fetching via rawUrl (works for public repos)
            const fetchHeaders: Record<string, string> = {};
            if (config.token && config.token.trim()) {
              fetchHeaders.Authorization = `Bearer ${config.token.trim()}`;
            }

            let textFetched = false;

            if (lyricsPath) {
              const lyricsRes = await fetch(lyricsPath, { headers: fetchHeaders });
              if (lyricsRes.ok) {
                const rawText = await lyricsRes.text();
                lyricsContent = rawText.replace(/\r\n/g, '\n').trim();
                textFetched = true;
              }
            }

            // Fallback for private repos using GitHub git blob API with raw header
            if (!textFetched && lyricsFileUrl) {
              const blobRes = await fetch(lyricsFileUrl, {
                headers: {
                  ...fetchHeaders,
                  Accept: 'application/vnd.github.v3.raw',
                },
              });
              if (blobRes.ok) {
                const rawText = await blobRes.text();
                lyricsContent = rawText.replace(/\r\n/g, '\n').trim();
              }
            }
          } catch (e) {
            console.warn('Error fetching lyrics from GitHub:', e);
          }
        }

        const song: SongItem = {
          id: `gh-${folderName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          number: songNumber,
          title: songTitle,
          category: '',
          coverImage: coverImage,
          lyrics: lyricsContent,
          resources: resources,
        };

        songs.push(song);
      }

      // Sort songs by number
      songs.sort((a, b) => a.number - b.number);

      const completeCount = songs.filter((s) => {
        const keys = Object.keys(s.resources) as HymnResourceKey[];
        return keys.filter((k) => s.resources[k]?.url).length === 6;
      }).length;

      return {
        success: true,
        message: `Sincronización exitosa: ${songs.length} canciones encontradas (${completeCount} completas con sus 6 voces) desde GitHub rama "${branch}".${detectedLyricsFile ? ` Archivo de letras encontrado (${detectedLyricsFile.fileName}).` : ''}`,
        songs: songs,
        branch: branch,
        totalFolders: songs.length,
        completeCount: completeCount,
        lyricsFile: detectedLyricsFile,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al procesar el repositorio de GitHub: ${err.message}`,
      };
    }
  },

  /**
   * Helper to trigger download of the unified lyrics file from the Letras/ folder
   */
  async downloadLyricsFile(lyricsFile: LyricsFileItem, token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (token && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      let blob: Blob;

      const res = await fetch(lyricsFile.rawUrl, { headers });
      if (res.ok) {
        blob = await res.blob();
      } else if (lyricsFile.blobUrl) {
        const blobRes = await fetch(lyricsFile.blobUrl, {
          headers: {
            ...headers,
            Accept: 'application/vnd.github.v3.raw',
          },
        });
        if (!blobRes.ok) throw new Error('No se pudo descargar el archivo');
        blob = await blobRes.blob();
      } else {
        throw new Error('No se pudo acceder a la URL del archivo');
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = lyricsFile.fileName || 'Letras_Completas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      return true;
    } catch (err) {
      console.warn('Direct fetch failed, falling back to direct link:', err);
      const a = document.createElement('a');
      a.href = lyricsFile.rawUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = lyricsFile.fileName || 'Letras_Completas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return false;
    }
  },
};
