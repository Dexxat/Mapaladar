import { Local } from '../dominio/local';

const NOCHE = [{ abre: '19:30', cierra: '23:30' }];

/**
 * Datos iniciales. Cuando exista una API, este archivo deja de usarse:
 * basta con cambiar el adaptador de LocalesRepositorio en app.config.ts.
 *
 * Coordenadas ubicadas con las esquinas de OpenStreetMap (Valerio: Moine y Aconquija;
 * Gurí: Entre Ríos y Dr. Mariano Moreno). Para ajustar: clic derecho en el mapa de Google.
 */
export const LOCALES: Local[] = [
  {
    id: 'pizzeria-valerio',
    nombre: 'Pizzería Valerio',
    rubro: 'pizza',
    direccion: 'Moine 1486, Bella Vista',
    ubicacion: { lat: -34.56254, lng: -58.6841 },
    web: 'https://dexxat.github.io/Pagina-Web-Pizzeria-Valerio/',
    horario: {
      sab: [{ abre: '11:30', cierra: '14:30' }, ...NOCHE],
      dom: NOCHE,
      lun: [],
      mar: NOCHE,
      mie: NOCHE,
      jue: NOCHE,
      vie: NOCHE,
    },
  },
  {
    id: 'guri',
    nombre: 'Gurí',
    rubro: 'cafe',
    direccion: 'Entre Ríos 707, Bella Vista',
    ubicacion: { lat: -34.56391, lng: -58.69064 },
    web: 'https://dexxat.github.io/proyecto-Guri-Cafe/',
    // horario: pendiente de conseguir
  },
];
