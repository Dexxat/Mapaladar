import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RUBROS } from '../../compartido/rubros';
import { Sprite } from '../../compartido/sprite';
import { Favoritos, Locales } from '../../core/estado';
import { Autenticacion } from '../../core/puertos';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Sprite],
  template: `
    <main class="inicio">
      <h1>Hola, {{ nombre() }}</h1>
      <p class="bajada">¿Qué querés hacer hoy?</p>

      <div class="opciones">
        <a class="opcion" routerLink="/mapa">
          <app-sprite [def]="sprites.pizza" [tam]="64" />
          <strong>Explorar el mapa</strong>
          <span>{{ cantidadLocales() }} locales en Bella Vista</span>
        </a>
        <a class="opcion" routerLink="/favoritos">
          <app-sprite [def]="sprites.cafe" [tam]="64" />
          <strong>Mis favoritos</strong>
          <span>{{ cantidadFavoritos() === 0 ? 'Todavía no guardaste ninguno' : cantidadFavoritos() + ' guardados' }}</span>
        </a>
        <div class="opcion pronto" aria-disabled="true">
          <app-sprite [def]="sprites.sushi" [tam]="64" />
          <strong>Mis pedidos</strong>
          <span>Próximamente</span>
        </div>
      </div>
    </main>
  `,
  styles: `
    .inicio { max-width: 960px; margin: 0 auto; padding: 40px 16px; }
    h1 { margin: 0; font: 700 36px var(--pixel); }
    .bajada { margin: 4px 0 28px; font-size: 18px; color: var(--gris); }
    .opciones { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .opcion {
      display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 20px;
      border: var(--borde); border-radius: 18px; background: var(--crema); box-shadow: 0 5px 0 var(--tinta);
      color: var(--tinta); text-decoration: none; transition: transform .15s;
    }
    a.opcion:hover { transform: translateY(-3px); }
    strong { font-size: 20px; }
    span { color: var(--gris); font-size: 14px; }
    .pronto { opacity: .55; box-shadow: none; border-style: dashed; }
  `,
})
export class Inicio {
  private readonly auth = inject(Autenticacion);
  private readonly locales = inject(Locales);
  private readonly favoritos = inject(Favoritos);

  protected readonly sprites = { cafe: RUBROS.cafe.sprite, pizza: RUBROS.pizza.sprite, sushi: RUBROS.sushi.sprite };
  protected readonly nombre = computed(() => this.auth.usuario()?.email.split('@')[0] ?? '');
  protected readonly cantidadLocales = computed(() => this.locales.todos().length);
  protected readonly cantidadFavoritos = computed(() => this.favoritos.lista().length);
}
