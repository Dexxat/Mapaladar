import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Autenticacion } from './puertos';

export const conSesion: CanActivateFn = () =>
  inject(Autenticacion).usuario() ? true : inject(Router).createUrlTree(['/']);

export const sinSesion: CanActivateFn = () =>
  inject(Autenticacion).usuario() ? inject(Router).createUrlTree(['/inicio']) : true;
