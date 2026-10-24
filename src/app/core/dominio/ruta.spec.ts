import { describe, expect, it } from 'vitest';
import { describirDistancia, describirDuracion, distanciaEnMetros } from './ruta';

describe('distanciaEnMetros', () => {
  it('mide la línea recta entre Gurí y Valerio (unos 620 m)', () => {
    const guri = { lat: -34.56391, lng: -58.69064 };
    const valerio = { lat: -34.56254, lng: -58.6841 };
    expect(distanciaEnMetros(guri, valerio)).toBeGreaterThan(600);
    expect(distanciaEnMetros(guri, valerio)).toBeLessThan(640);
  });
});

describe('describirDistancia', () => {
  it('usa metros redondeados a la decena por debajo del kilómetro', () => {
    expect(describirDistancia(894)).toBe('890 m');
  });

  it('usa kilómetros con coma decimal desde el kilómetro', () => {
    expect(describirDistancia(1218)).toBe('1,2 km');
  });
});

describe('describirDuracion', () => {
  it('nunca muestra menos de 1 minuto', () => {
    expect(describirDuracion(10)).toBe('1 min');
  });

  it('pasa a horas desde los 60 minutos', () => {
    expect(describirDuracion(3900)).toBe('1 h 05 min');
  });
});
