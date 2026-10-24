/**
 * Horarios de apertura: lógica pura, sin Angular, fácil de testear.
 *
 * Una franja cuyo cierre es menor o igual a su apertura termina al día
 * siguiente (por ejemplo 20:00 a 01:30).
 */

export type DiaSemana = 'dom' | 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab';

/** Mismo orden que Date.getDay(): 0 = domingo. */
export const DIAS: readonly DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

export interface Franja {
  abre: string; // 'HH:mm'
  cierra: string; // 'HH:mm'
}

/** Un día ausente o con lista vacía significa cerrado. */
export type HorarioSemanal = Partial<Record<DiaSemana, Franja[]>>;

export type EstadoApertura =
  | { tipo: 'abierto'; cierra: string }
  | { tipo: 'cerrado'; abre: { dia: DiaSemana; hora: string } | null }
  | { tipo: 'sin-horario' };

const MIN_DIA = 24 * 60;
const MIN_SEMANA = 7 * MIN_DIA;

function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

interface Intervalo {
  inicio: number; // minutos desde el domingo 00:00
  fin: number;
  franja: Franja;
  dia: DiaSemana;
}

function intervalosDeLaSemana(horario: HorarioSemanal): Intervalo[] {
  return DIAS.flatMap((dia, i) =>
    (horario[dia] ?? []).map((franja) => {
      const inicio = i * MIN_DIA + aMinutos(franja.abre);
      let fin = i * MIN_DIA + aMinutos(franja.cierra);
      if (fin <= inicio) fin += MIN_DIA;
      return { inicio, fin, franja, dia };
    }),
  );
}

export function estadoApertura(horario: HorarioSemanal | undefined, ahora: Date): EstadoApertura {
  if (!horario) return { tipo: 'sin-horario' };

  const intervalos = intervalosDeLaSemana(horario);
  const t = ahora.getDay() * MIN_DIA + ahora.getHours() * 60 + ahora.getMinutes();

  // El sábado a la noche puede seguir abierto el domingo de madrugada: miramos t y t + semana.
  const abierto = intervalos.find(
    (iv) => (t >= iv.inicio && t < iv.fin) || (t + MIN_SEMANA >= iv.inicio && t + MIN_SEMANA < iv.fin),
  );
  if (abierto) return { tipo: 'abierto', cierra: abierto.franja.cierra };

  const proximo = intervalos
    .map((iv) => ({ iv, espera: (iv.inicio - t + MIN_SEMANA) % MIN_SEMANA }))
    .sort((a, b) => a.espera - b.espera)[0];

  return {
    tipo: 'cerrado',
    abre: proximo ? { dia: proximo.iv.dia, hora: proximo.iv.franja.abre } : null,
  };
}

const NOMBRE_DIA: Record<DiaSemana, string> = {
  dom: 'dom',
  lun: 'lun',
  mar: 'mar',
  mie: 'mié',
  jue: 'jue',
  vie: 'vie',
  sab: 'sáb',
};

/** Texto corto para mostrar en las tarjetas. */
export function describirEstado(estado: EstadoApertura, ahora: Date): string {
  switch (estado.tipo) {
    case 'abierto':
      return `Abierto · cierra ${estado.cierra}`;
    case 'sin-horario':
      return 'Horario no disponible';
    case 'cerrado': {
      if (!estado.abre) return 'Cerrado';
      const hoy = DIAS[ahora.getDay()];
      const cuando = estado.abre.dia === hoy ? '' : `${NOMBRE_DIA[estado.abre.dia]} `;
      return `Cerrado · abre ${cuando}${estado.abre.hora}`;
    }
  }
}
