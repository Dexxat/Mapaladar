import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import {
  AutenticacionLocal,
  FavoritosEnNavegador,
  LocalesEnMemoria,
  NavegacionGoogleMaps,
  RutasOsrm,
  UbicacionNavegador,
} from './core/adaptadores';
import {
  Autenticacion,
  FavoritosRepositorio,
  LocalesRepositorio,
  Navegacion,
  Rutas,
  Ubicacion,
} from './core/puertos';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // Puerto → implementación. Para usar una API, cambiar solo la clase de la derecha.
    { provide: LocalesRepositorio, useClass: LocalesEnMemoria },
    { provide: Autenticacion, useClass: AutenticacionLocal },
    { provide: FavoritosRepositorio, useClass: FavoritosEnNavegador },
    { provide: Ubicacion, useClass: UbicacionNavegador },
    { provide: Rutas, useClass: RutasOsrm },
    { provide: Navegacion, useClass: NavegacionGoogleMaps },
  ],
};
