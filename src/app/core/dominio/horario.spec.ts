import { describe, expect, it } from 'vitest';
import { describirEstado, estadoApertura, HorarioSemanal } from './horario';

// Horario real de Pizzería Valerio
const valerio: HorarioSemanal = {
  sab: [
    { abre: '11:30', cierra: '14:30' },
    { abre: '19:30', cierra: '23:30' },
  ],
  dom: [{ abre: '19:30', cierra: '23:30' }],
  lun: [],
  mar: [{ abre: '19:30', cierra: '23:30' }],
  mie: [{ abre: '19:30', cierra: '23:30' }],
  jue: [{ abre: '19:30', cierra: '23:30' }],
  vie: [{ abre: '19:30', cierra: '23:30' }],
};

// 24/10/2026 es sábado
const sabado = (h: number, m = 0) => new Date(2026, 9, 24, h, m);
const lunes = (h: number, m = 0) => new Date(2026, 9, 26, h, m);

describe('estadoApertura', () => {
  it('sin horario cargado', () => {
    expect(estadoApertura(undefined, sabado(12))).toEqual({ tipo: 'sin-horario' });
  });

  it('abierto en la franja del mediodía', () => {
    expect(estadoApertura(valerio, sabado(12))).toEqual({ tipo: 'abierto', cierra: '14:30' });
  });

  it('cerrado entre franjas, abre más tarde el mismo día', () => {
    const estado = estadoApertura(valerio, sabado(16));
    expect(estado).toEqual({ tipo: 'cerrado', abre: { dia: 'sab', hora: '19:30' } });
    expect(describirEstado(estado, sabado(16))).toBe('Cerrado · abre 19:30');
  });

  it('el cierre es exclusivo', () => {
    expect(estadoApertura(valerio, sabado(23, 30)).tipo).toBe('cerrado');
  });

  it('lunes cerrado, abre el martes', () => {
    const estado = estadoApertura(valerio, lunes(20));
    expect(describirEstado(estado, lunes(20))).toBe('Cerrado · abre mar 19:30');
  });

  it('franja que pasa la medianoche del sábado al domingo', () => {
    const nocturno: HorarioSemanal = { sab: [{ abre: '20:00', cierra: '02:00' }] };
    const domingoMadrugada = new Date(2026, 9, 25, 1, 0);
    expect(estadoApertura(nocturno, domingoMadrugada)).toEqual({ tipo: 'abierto', cierra: '02:00' });
  });

  it('horario vacío: cerrado sin próxima apertura', () => {
    expect(estadoApertura({}, sabado(12))).toEqual({ tipo: 'cerrado', abre: null });
  });
});
