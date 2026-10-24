/** Aspecto visual de cada rubro: nombre, color y sprite de Piskel. */
import { Rubro } from '../core/dominio/local';

export interface SpriteDef {
  url: string;
  cuadros: number;
  fps: number;
}

export interface RubroVisual {
  nombre: string;
  color: string;
  sprite: SpriteDef;
}

export const RUBROS: Record<Rubro, RubroVisual> = {
  cafe: { nombre: 'Cafetería', color: '#D9822B', sprite: { url: 'sprites/taza.png', cuadros: 5, fps: 9 } },
  pizza: { nombre: 'Pizzería', color: '#C4472F', sprite: { url: 'sprites/pizza.png', cuadros: 5, fps: 7 } },
  sushi: { nombre: 'Japonesa', color: '#2D7A82', sprite: { url: 'sprites/sushi.png', cuadros: 5, fps: 8 } },
};

export const LOGO: SpriteDef = { url: 'sprites/logo.png', cuadros: 4, fps: 7 };
export const CORAZON: SpriteDef = { url: 'sprites/corazon.png', cuadros: 6, fps: 5 };

/** Variables CSS que usa la clase .sprite de styles.scss. */
export function estiloSprite(s: SpriteDef, tam = 48): string {
  return `--img:url(${s.url});--cuadros:${s.cuadros};--dur:${(s.cuadros / s.fps).toFixed(2)}s;--tam:${tam}px`;
}
