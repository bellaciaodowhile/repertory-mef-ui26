import { SongItem } from '../types/hymn';

const RAW_BASE = 'https://raw.githubusercontent.com/bellaciaodowhile/mef-2026-repertory/main';

export function createInitialHymns(): SongItem[] {
  return [
    {
      id: 'song-1',
      number: 1,
      title: 'Grandioso Es Nuestro Dios',
      subtitle: 'Música en Familia 2026',
      category: '',
      composer: 'Coral Música en Familia',
      resources: {
        demo: {
          url: `${RAW_BASE}/Grandioso%20Es%20Nuestro%20Dios/Demo.mp3`,
          fileName: 'Demo.mp3',
          fileSize: 5308327,
        },
        pista: {
          url: `${RAW_BASE}/Grandioso%20Es%20Nuestro%20Dios/Pista.mp3`,
          fileName: 'Pista.mp3',
          fileSize: 5306742,
        },
        soprano: {
          url: `${RAW_BASE}/Grandioso%20Es%20Nuestro%20Dios/Soprano.mp3`,
          fileName: 'Soprano.mp3',
          fileSize: 5282506,
        },
        contralto: {
          url: `${RAW_BASE}/Grandioso%20Es%20Nuestro%20Dios/Contralto.mp3`,
          fileName: 'Contralto.mp3',
          fileSize: 5275450,
        },
        tenor: {
          url: `${RAW_BASE}/Grandioso%20Es%20Nuestro%20Dios/Tenor.mp3`,
          fileName: 'Tenor.mp3',
          fileSize: 5285751,
        },
        bajo: null,
      },
    },
    {
      id: 'song-2',
      number: 2,
      title: 'La Bondad de Dios',
      subtitle: 'Música en Familia 2026',
      category: '',
      composer: 'Coral Música en Familia',
      resources: {
        demo: {
          url: `${RAW_BASE}/La%20Bondad%20de%20Dios/Demo.mp3`,
          fileName: 'Demo.mp3',
          fileSize: 5040421,
        },
        pista: {
          url: `${RAW_BASE}/La%20Bondad%20de%20Dios/Pista.mp3`,
          fileName: 'Pista.mp3',
          fileSize: 5039585,
        },
        soprano: {
          url: `${RAW_BASE}/La%20Bondad%20de%20Dios/Soprano.mp3`,
          fileName: 'Soprano.mp3',
          fileSize: 5040421,
        },
        contralto: {
          url: `${RAW_BASE}/La%20Bondad%20de%20Dios/Contralto.mp3`,
          fileName: 'Contralto.mp3',
          fileSize: 5040421,
        },
        tenor: {
          url: `${RAW_BASE}/La%20Bondad%20de%20Dios/Tenor.mp3`,
          fileName: 'Tenor.mp3',
          fileSize: 5040421,
        },
        bajo: null,
      },
    },
    {
      id: 'song-3',
      number: 3,
      title: 'La Fe',
      subtitle: 'Música en Familia 2026',
      category: '',
      composer: 'Coral Música en Familia',
      resources: {
        demo: {
          url: `${RAW_BASE}/La%20Fe/Demo.mp3`,
          fileName: 'Demo.mp3',
          fileSize: 11714036,
        },
        pista: {
          url: `${RAW_BASE}/La%20Fe/Pista.mp3`,
          fileName: 'Pista.mp3',
          fileSize: 5943603,
        },
        soprano: {
          url: `${RAW_BASE}/La%20Fe/Soprano.mp3`,
          fileName: 'Soprano.mp3',
          fileSize: 10665892,
        },
        contralto: {
          url: `${RAW_BASE}/La%20Fe/Contralto.mp3`,
          fileName: 'Contralto.mp3',
          fileSize: 10628232,
        },
        tenor: {
          url: `${RAW_BASE}/La%20Fe/Tenor.mp3`,
          fileName: 'Tenor.mp3',
          fileSize: 5850777,
        },
        bajo: {
          url: `${RAW_BASE}/La%20Fe/Bajo.mp3`,
          fileName: 'Bajo.mp3',
          fileSize: 5850777,
        },
      },
    },
    {
      id: 'song-4',
      number: 4,
      title: 'Mas Adelante',
      subtitle: 'Música en Familia 2026',
      category: '',
      composer: 'Coral Música en Familia',
      resources: {
        demo: {
          url: `${RAW_BASE}/Mas%20Adelante/Demo.mp3`,
          fileName: 'Demo.mp3',
          fileSize: 5499438,
        },
        pista: null,
        soprano: {
          url: `${RAW_BASE}/Mas%20Adelante/Soprano.mp3`,
          fileName: 'Soprano.mp3',
          fileSize: 5529341,
        },
        contralto: {
          url: `${RAW_BASE}/Mas%20Adelante/Contralto.mp3`,
          fileName: 'Contralto.mp3',
          fileSize: 3229822,
        },
        tenor: {
          url: `${RAW_BASE}/Mas%20Adelante/Tenor.mp3`,
          fileName: 'Tenor.mp3',
          fileSize: 3229822,
        },
        bajo: null,
      },
    },
    {
      id: 'song-5',
      number: 5,
      title: 'Medley Regreso de Jesús',
      subtitle: 'Música en Familia 2026',
      category: '',
      composer: 'Coral Música en Familia',
      resources: {
        demo: {
          url: `${RAW_BASE}/Medley%20Regreso%20de%20Jes%C3%BAs/Demo.mp3`,
          fileName: 'Demo.mp3',
          fileSize: 7361652,
        },
        pista: {
          url: `${RAW_BASE}/Medley%20Regreso%20de%20Jes%C3%BAs/Pista.mp3`,
          fileName: 'Pista.mp3',
          fileSize: 7363532,
        },
        soprano: {
          url: `${RAW_BASE}/Medley%20Regreso%20de%20Jes%C3%BAs/Soprano.MP3`,
          fileName: 'Soprano.MP3',
          fileSize: 4865094,
        },
        contralto: {
          url: `${RAW_BASE}/Medley%20Regreso%20de%20Jes%C3%BAs/Contralto.MP3`,
          fileName: 'Contralto.MP3',
          fileSize: 4906472,
        },
        tenor: {
          url: `${RAW_BASE}/Medley%20Regreso%20de%20Jes%C3%BAs/Tenor.MP3`,
          fileName: 'Tenor.MP3',
          fileSize: 4906472,
        },
        bajo: null,
      },
    },
  ];
}
