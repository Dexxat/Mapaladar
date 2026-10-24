import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TarjetaLocal } from '../../compartido/tarjeta-local';
import { Favoritos } from '../../core/estado';

@Component({
  selector: 'app-favoritos',
  imports: [TarjetaLocal, RouterLink],
  template: `
    <main class="favoritos">
      <h1>Mis favoritos</h1>
      @if (favoritos.lista().length) {
        <div class="grilla">
          @for (local of favoritos.lista(); track local.id) {
            <app-tarjeta-local [local]="local" (elegir)="verEnMapa()" />
          }
        </div>
      } @else {
        <div class="vacio">
          <p>Todavía no guardaste ningún local.</p>
          <p>Tocá el corazón de un local en el mapa para tenerlo a mano acá.</p>
          <a class="boton primario" routerLink="/mapa">Ir al mapa</a>
        </div>
      }
    </main>
  `,
  styles: `
    .favoritos { max-width: 960px; margin: 0 auto; padding: 32px 16px; }
    h1 { margin: 0 0 20px; font: 700 32px var(--pixel); }
    .grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .vacio { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; color: var(--gris); }
    .vacio p { margin: 0; }
    .vacio .boton { margin-top: 16px; }
  `,
})
export class FavoritosPagina {
  protected readonly favoritos = inject(Favoritos);
  private readonly router = inject(Router);

  protected verEnMapa(): void {
    this.router.navigate(['/mapa']);
  }
}
