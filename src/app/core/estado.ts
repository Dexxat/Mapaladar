/** Estado compartido de la app, basado en signals. */
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FavoritosRepositorio, LocalesRepositorio } from './puertos';

@Injectable({ providedIn: 'root' })
export class Locales {
  readonly todos = toSignal(inject(LocalesRepositorio).listar(), { initialValue: [] });
}

@Injectable({ providedIn: 'root' })
export class Favoritos {
  private readonly repo = inject(FavoritosRepositorio);
  private readonly locales = inject(Locales);
  private readonly ids = signal<ReadonlySet<string>>(new Set());

  readonly lista = computed(() => this.locales.todos().filter((l) => this.ids().has(l.id)));

  constructor() {
    this.repo.cargar().then((ids) => this.ids.set(new Set(ids)));
  }

  esFavorito(id: string): boolean {
    return this.ids().has(id);
  }

  alternar(id: string): void {
    const ids = new Set(this.ids());
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    this.ids.set(ids);
    this.repo.guardar([...ids]);
  }
}

/** Hora actual, actualizada cada minuto, para recalcular abierto / cerrado. */
@Injectable({ providedIn: 'root' })
export class Reloj {
  readonly ahora = signal(new Date());

  constructor() {
    const id = setInterval(() => this.ahora.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
