import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOGO } from '../../compartido/rubros';
import { Sprite } from '../../compartido/sprite';
import { Autenticacion } from '../../core/puertos';

/** Barra superior y navegación de las pantallas con sesión iniciada. */
@Component({
  selector: 'app-marco',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Sprite],
  template: `
    <header>
      <a class="marca" routerLink="/inicio"><app-sprite [def]="logo" [tam]="44" />Mapaladar</a>
      <nav aria-label="Principal">
        <a routerLink="/mapa" routerLinkActive="activo" ariaCurrentWhenActive="page">Mapa</a>
        <a routerLink="/favoritos" routerLinkActive="activo" ariaCurrentWhenActive="page">Favoritos</a>
      </nav>
      <button type="button" class="salir" (click)="salir()">Salir</button>
    </header>
    <div class="contenido"><router-outlet /></div>
  `,
  styles: `
    :host { height: 100%; display: flex; flex-direction: column; }
    header {
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px;
      padding: 8px 16px; background: var(--crema); border-bottom: var(--borde);
    }
    .marca { display: flex; align-items: center; gap: 8px; font: 700 24px var(--pixel); color: var(--tinta); text-decoration: none; }
    nav { display: flex; gap: 4px; margin-left: auto; }
    nav a, .salir {
      display: flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 10px;
      color: var(--tinta); font: 700 15px var(--fuente); text-decoration: none;
    }
    nav a.activo { background: var(--tinta); color: var(--crema); }
    .salir { border: 0; background: none; color: var(--gris); cursor: pointer; }
    .contenido { flex: 1; min-height: 0; overflow: auto; }
  `,
})
export class Marco {
  private readonly auth = inject(Autenticacion);
  private readonly router = inject(Router);
  protected readonly logo = LOGO;

  protected salir(): void {
    this.auth.salir();
    this.router.navigate(['/']);
  }
}
