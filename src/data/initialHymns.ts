import { SongItem } from '../types/hymn';

// Clean basic audio tone data URL for demonstration (silent/chime wave)
function createSampleAudio(frequency: number = 440): string {
  const sampleRate = 8000;
  const duration = 6;
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 0.7);
    const sample = Math.sin(2 * Math.PI * frequency * t) * env * 0.4;
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export function createInitialHymns(): SongItem[] {
  return [
    {
      id: 'song-1',
      number: 1,
      title: 'A Través de los Años',
      subtitle: 'Tema Central 2026',
      category: '',
      keySignature: 'Re Mayor',
      tempo: 'Andante Maestoso (76 BPM)',
      composer: 'Música en Familia',
      notes: 'Entrada coral al unísono. En el estribillo, división completa a 4 voces (SATB). Mantener el tempo constante y respirar en las frases señaladas.',
      lyrics: `[Estrofa 1]
A través de los años tu mano guió,
en noches oscuras tu luz brilló;
cantamos unidos con un corazón,
alzando al cielo sincera canción.

[Coro]
Música en familia, por siempre cantar,
las sendas del tiempo queremos honrar;
Dios ha sido fiel, su amor sin igual,
a través de los años, gozo celestial.

[Estrofa 2]
Generaciones que vienen y van,
tu santa palabra por siempre tendrán;
un lazo de paz, armonía y fervor,
unidos cantando la gloria al Señor.`,
      resources: {
        demo: {
          url: createSampleAudio(523.25),
          fileName: '01_a_traves_de_los_anos_demo.wav',
          fileSize: 96000,
          duration: 6,
        },
        pista: {
          url: createSampleAudio(392.00),
          fileName: '01_a_traves_de_los_anos_pista.wav',
          fileSize: 96000,
          duration: 6,
        },
        soprano: {
          url: createSampleAudio(659.25),
          fileName: '01_a_traves_de_los_anos_soprano.wav',
          fileSize: 96000,
          duration: 6,
        },
        contralto: {
          url: createSampleAudio(440.00),
          fileName: '01_a_traves_de_los_anos_contralto.wav',
          fileSize: 96000,
          duration: 6,
        },
        tenor: {
          url: createSampleAudio(329.63),
          fileName: '01_a_traves_de_los_anos_tenor.wav',
          fileSize: 96000,
          duration: 6,
        },
        bajo: {
          url: createSampleAudio(220.00),
          fileName: '01_a_traves_de_los_anos_bajo.wav',
          fileSize: 96000,
          duration: 6,
        },
      },
    },
    {
      id: 'song-2',
      number: 2,
      title: 'Cantad con Alegría',
      subtitle: 'Himno de Celebración',
      category: 'Alabanza',
      keySignature: 'Sol Mayor',
      tempo: 'Allegro moderato (96 BPM)',
      composer: 'Arreglo Coral 2026',
      coverImage: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&auto=format&fit=crop&q=80',
      notes: 'Carácter alegre y articulado. Sopranos lideran la melodía con proyección clara. Bajos marcan los pulsos 1 y 3 firmemente.',
      lyrics: `[Estrofa 1]
Cantad con alegría al Creador,
pueblo bendito del gran Salvador;
vengan las voces con gozo y loor,
todos cantando la paz del Señor.

[Coro]
¡Gloria, aleluya! Cantad sin cesar,
voces celestes se unen al son;
en su presencia queremos estar,
con alabanza y adoración.`,
      resources: {
        demo: {
          url: createSampleAudio(587.33),
          fileName: '02_cantad_con_alegria_demo.wav',
          fileSize: 96000,
          duration: 6,
        },
        pista: {
          url: createSampleAudio(440.00),
          fileName: '02_cantad_con_alegria_pista.wav',
          fileSize: 96000,
          duration: 6,
        },
        soprano: {
          url: createSampleAudio(783.99),
          fileName: '02_cantad_con_alegria_soprano.wav',
          fileSize: 96000,
          duration: 6,
        },
        contralto: {
          url: createSampleAudio(493.88),
          fileName: '02_cantad_con_alegria_contralto.wav',
          fileSize: 96000,
          duration: 6,
        },
        tenor: {
          url: createSampleAudio(392.00),
          fileName: '02_cantad_con_alegria_tenor.wav',
          fileSize: 96000,
          duration: 6,
        },
        bajo: {
          url: createSampleAudio(261.63),
          fileName: '02_cantad_con_alegria_bajo.wav',
          fileSize: 96000,
          duration: 6,
        },
      },
    },
    {
      id: 'song-3',
      number: 3,
      title: 'Unidos en Oración',
      subtitle: 'Meditación Coral',
      category: 'Comunión',
      keySignature: 'Fa Mayor',
      tempo: 'Lento devocional (68 BPM)',
      composer: 'Coral Música en Familia',
      coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80',
      notes: 'Tempo muy solemne. Respiración diafragmática profunda. En los compases 9 al 16, dinámica pianissimo (pp).',
      lyrics: `[Estrofa 1]
En el silencio de la oración,
unimos almas de corazón;
Dios de los siglos, escucha la voz
de tus siervos clamando hoy a Dios.`,
      resources: {
        demo: {
          url: createSampleAudio(440.00),
          fileName: '03_unidos_oracion_demo.wav',
          fileSize: 96000,
          duration: 6,
        },
        pista: {
          url: createSampleAudio(349.23),
          fileName: '03_unidos_oracion_pista.wav',
          fileSize: 96000,
          duration: 6,
        },
        soprano: {
          url: createSampleAudio(698.46),
          fileName: '03_unidos_oracion_soprano.wav',
          fileSize: 96000,
          duration: 6,
        },
        contralto: {
          url: createSampleAudio(440.00),
          fileName: '03_unidos_oracion_contralto.wav',
          fileSize: 96000,
          duration: 6,
        },
        tenor: null, // Incompleto a modo de ejemplo
        bajo: null, // Incompleto a modo de ejemplo
      },
    },
    {
      id: 'song-4',
      number: 4,
      title: 'Hogar de Paz y Luz',
      subtitle: 'Canto Familiar',
      category: 'Familia y Hogar',
      keySignature: 'Si bemol Mayor',
      tempo: 'Moderato calmo (80 BPM)',
      composer: 'Tradicional / Música en Familia',
      coverImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
      notes: 'Carácter dulce y cálido. Énfasis en la dicción clara de las palabras. Contraltos y Tenores conducen la armonía interior.',
      lyrics: `[Estrofa 1]
Bendice Señor nuestro dulce hogar,
donde tu paz reine sin cesar;
entre acordes de santa quietud,
danos tu amor y tu plenitud.`,
      resources: {
        demo: {
          url: createSampleAudio(466.16),
          fileName: '04_hogar_paz_demo.wav',
          fileSize: 96000,
          duration: 6,
        },
        pista: null, // Incompleto a modo de ejemplo
        soprano: {
          url: createSampleAudio(587.33),
          fileName: '04_hogar_paz_soprano.wav',
          fileSize: 96000,
          duration: 6,
        },
        contralto: {
          url: createSampleAudio(466.16),
          fileName: '04_hogar_paz_contralto.wav',
          fileSize: 96000,
          duration: 6,
        },
        tenor: {
          url: createSampleAudio(349.23),
          fileName: '04_hogar_paz_tenor.wav',
          fileSize: 96000,
          duration: 6,
        },
        bajo: {
          url: createSampleAudio(233.08),
          fileName: '04_hogar_paz_bajo.wav',
          fileSize: 96000,
          duration: 6,
        },
      },
    },
  ];
}
