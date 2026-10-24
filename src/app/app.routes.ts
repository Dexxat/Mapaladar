import { Routes } from '@angular/router';
import { conSesion, sinSesion } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [sinSesion],
    loadComponent: () => import('./pantallas/bienvenida/bienvenida').then((m) => m.Bienvenida),
  },
  {
    path: '',
    canActivate: [conSesion],
    loadComponent: () => import('./pantallas/marco/marco').then((m) => m.Marco),
    children: [
      { path: 'inicio', title: 'Mapaladar', loadComponent: () => import('./pantallas/inicio/inicio').then((m) => m.Inicio) },
      { path: 'mapa', title: 'Mapa · Mapaladar', loadComponent: () => import('./pantallas/mapa/mapa').then((m) => m.Mapa) },
      { path: 'favoritos', title: 'Favoritos · Mapaladar', loadComponent: () => import('./pantallas/favoritos/favoritos').then((m) => m.FavoritosPagina) },
    ],
  },
  { path: '**', redirectTo: '' },
];
