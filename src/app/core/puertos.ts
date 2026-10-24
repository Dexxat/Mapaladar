/**
 * Puertos: los contratos que usa la app. Cada uno tiene hoy una implementación
 * local (carpeta adaptadores/) y mañana puede tener otra que llame a una API,
 * sin tocar pantallas ni componentes. El cambio se hace en app.config.ts.
 */
import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Coordenadas, Local } from './dominio/local';
import { ModoViaje, Ruta } from './dominio/ruta';

export abstract class LocalesRepositorio {
  abstract listar(): Observable<Local[]>;
}

export interface Usuario {
  email: string;
}

export abstract class Autenticacion {
  abstract readonly usuario: Signal<Usuario | null>;
  abstract ingresar(email: string, clave: string): Promise<void>;
  abstract salir(): void;
}

export abstract class FavoritosRepositorio {
  abstract cargar(): Promise<string[]>;
  abstract guardar(ids: string[]): Promise<void>;
}

/** Posición del usuario (hoy el GPS del navegador). */
export abstract class Ubicacion {
  abstract obtener(): Promise<Coordenadas>;
}

/** Recorrido por calles para dibujar dentro del mapa de la app. */
export abstract class Rutas {
  abstract calcular(origen: Coordenadas, destino: Coordenadas, modo: ModoViaje): Promise<Ruta>;
}

/** Enlace para seguir la ruta en una app externa (hoy Google Maps; podría ser Waze). */
export abstract class Navegacion {
  abstract urlRuta(destino: Coordenadas): string;
}
