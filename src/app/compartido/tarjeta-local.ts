import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { describirEstado, estadoApertura } from '../core/dominio/horario';
import { Local } from '../core/dominio/local';
import { Favoritos, Reloj } from '../core/estado';
import { RUBROS } from './rubros';
import { Sprite } from './sprite';

@Component({
  selector: 'app-tarjeta-local',
  imports: [Sprite, RouterLink],
  template: `
    <article class="tarjeta" [class.activa]="activa()">
      <button type="button" class="cabecera" (click)="elegir.emit(local().id)"
        [attr.aria-pressed]="activa()" [attr.aria-label]="'Ver ' + local().nombre + ' en el mapa'">
        <span class="icono"><app-sprite [def]="rubro().sprite" [tam]="40" /></span>
        <span class="datos">
          <strong>{{ local().nombre }}</strong>
          <span class="sub">{{ rubro().nombre }} · {{ local().direccion }}</span>
          <span class="estado" [attr.data-estado]="estado().tipo"><i></i>{{ textoEstado() }}</span>
        </span>
      </button>
      <button type="button" class="fav" (click)="favoritos.alternar(local().id)"
        [attr.aria-pressed]="esFavorito()"
        [attr.aria-label]="esFavorito() ? 'Quitar de favoritos' : 'Agregar a favoritos'">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      </button>
      <div class="acciones">
        <a class="boton primario" [href]="local().web" target="_blank" rel="noopener">Pedir</a>
        <a class="boton acento" routerLink="/mapa" [queryParams]="{ ir: local().id }"
          [attr.aria-label]="'Cómo llegar a ' + local().nombre">Ir</a>
      </div>
    </article>
  `,
  styleUrl: './tarjeta-local.scss',
})
export class TarjetaLocal {
  readonly local = input.required<Local>();
  readonly activa = input(false);
  readonly elegir = output<string>();

  protected readonly favoritos = inject(Favoritos);
  private readonly reloj = inject(Reloj);

  protected readonly rubro = computed(() => RUBROS[this.local().rubro]);
  protected readonly estado = computed(() => estadoApertura(this.local().horario, this.reloj.ahora()));
  protected readonly textoEstado = computed(() => describirEstado(this.estado(), this.reloj.ahora()));
  protected readonly esFavorito = computed(() => this.favoritos.esFavorito(this.local().id));
}
