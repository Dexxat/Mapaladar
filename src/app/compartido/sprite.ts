import { Component, computed, input } from '@angular/core';
import { estiloSprite, SpriteDef } from './rubros';

@Component({
  selector: 'app-sprite',
  template: `<span class="sprite" [attr.style]="estilo()" [attr.role]="etiqueta() ? 'img' : null"
    [attr.aria-label]="etiqueta() || null" [attr.aria-hidden]="etiqueta() ? null : 'true'"></span>`,
  styles: `:host { display: inline-flex; }`,
})
export class Sprite {
  readonly def = input.required<SpriteDef>();
  readonly tam = input(48);
  readonly etiqueta = input('');
  protected readonly estilo = computed(() => estiloSprite(this.def(), this.tam()));
}
