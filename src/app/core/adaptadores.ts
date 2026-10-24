/**
 * Implementaciones actuales de los puertos. Todo funciona en el navegador,
 * sin servidor. Para conectar una API, crear otra clase que extienda el
 * mismo puerto y registrarla en app.config.ts.
 */
import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';
import { LOCALES } from './datos/locales.data';
import { Coordenadas } from './dominio/local';
import { ModoViaje, Ruta } from './dominio/ruta';
import {
  Autenticacion,
  FavoritosRepositorio,
  LocalesRepositorio,
  Navegacion,
  Rutas,
  Ubicacion,
  Usuario,
} from './puertos';

function leer<T>(clave: string, valorPorDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible: se pierde al recargar */
  }
}

@Injectable()
export class LocalesEnMemoria extends LocalesRepositorio {
  listar() {
    return of(LOCALES);
  }
}

/** Sesión simulada: acepta cualquier email y una clave de 4 caracteres o más. */
@Injectable()
export class AutenticacionLocal extends Autenticacion {
  private readonly clave = 'mapaladar.sesion';
  private readonly _usuario = signal<Usuario | null>(leer(this.clave, null));
  readonly usuario = this._usuario.asReadonly();

  async ingresar(email: string, clave: string): Promise<void> {
    if (!email.includes('@') || clave.length < 4) {
      throw new Error('Revisá el email y que la contraseña tenga al menos 4 caracteres.');
    }
    const usuario = { email: email.trim().toLowerCase() };
    escribir(this.clave, usuario);
    this._usuario.set(usuario);
  }

  salir(): void {
    escribir(this.clave, null);
    this._usuario.set(null);
  }
}

@Injectable()
export class FavoritosEnNavegador extends FavoritosRepositorio {
  private readonly clave = 'mapaladar.favoritos';

  async cargar(): Promise<string[]> {
    return leer<string[]>(this.clave, []);
  }

  async guardar(ids: string[]): Promise<void> {
    escribir(this.clave, ids);
  }
}

@Injectable()
export class UbicacionNavegador extends Ubicacion {
  obtener(): Promise<Coordenadas> {
    return new Promise((resolver, rechazar) => {
      if (!('geolocation' in navigator)) {
        rechazar(new Error('Este navegador no permite obtener tu ubicación.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => rechazar(new Error('No pudimos obtener tu ubicación. Revisá los permisos del navegador.')),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }
}

@Injectable()
export class NavegacionGoogleMaps extends Navegacion {
  urlRuta({ lat, lng }: Coordenadas): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
}

/**
 * Ruteo de FOSSGIS (el que usa openstreetmap.org): gratis y sin clave, pensado para uso
 * moderado. Para producción conviene OpenRouteService o GraphHopper con clave propia.
 */
@Injectable()
export class RutasOsrm extends Rutas {
  private readonly perfiles: Record<ModoViaje, string> = { pie: 'routed-foot', auto: 'routed-car' };

  async calcular(origen: Coordenadas, destino: Coordenadas, modo: ModoViaje): Promise<Ruta> {
    const tramo = `${origen.lng},${origen.lat};${destino.lng},${destino.lat}`;
    const url = `https://routing.openstreetmap.de/${this.perfiles[modo]}/route/v1/driving/${tramo}?overview=full&geometries=geojson`;
    const respuesta = await fetch(url).catch(() => null);
    const datos = respuesta?.ok ? await respuesta.json() : null;
    const ruta = datos?.code === 'Ok' ? datos.routes[0] : null;
    if (!ruta) throw new Error('No pudimos calcular el recorrido. Probá de nuevo en un rato.');
    return {
      puntos: ruta.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
      metros: ruta.distance,
      segundos: ruta.duration,
    };
  }
}
