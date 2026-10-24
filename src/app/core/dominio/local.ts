import { HorarioSemanal } from './horario';

export type Rubro = 'cafe' | 'pizza' | 'sushi';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Local {
  id: string;
  nombre: string;
  rubro: Rubro;
  direccion: string;
  ubicacion: Coordenadas;
  /** Sitio single page del local. */
  web: string;
  /** Sin horario cargado, el local se muestra como "Horario no disponible". */
  horario?: HorarioSemanal;
}
