import { Coordenadas } from './local';

export type ModoViaje = 'pie' | 'auto';

/** Recorrido por calles entre dos puntos. */
export interface Ruta {
  /** Puntos de la línea a dibujar, en orden. */
  puntos: Coordenadas[];
  metros: number;
  segundos: number;
}

/** Más allá de esta distancia en línea recta no se calcula la ruta dentro de la app. */
export const DISTANCIA_MAXIMA_RUTA_METROS = 20_000;

const RADIO_TIERRA_METROS = 6_371_000;

/** Distancia en línea recta (fórmula del haversine). */
export function distanciaEnMetros(a: Coordenadas, b: Coordenadas): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.sqrt(h));
}

/** "650 m" o "1,2 km". */
export function describirDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

/** "1 min", "12 min" o "1 h 05 min". */
export function describirDuracion(segundos: number): string {
  const minutos = Math.max(1, Math.round(segundos / 60));
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
}
