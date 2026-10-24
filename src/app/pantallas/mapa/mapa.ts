import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { TarjetaLocal } from '../../compartido/tarjeta-local';
import { RUBROS } from '../../compartido/rubros';
import { estadoApertura } from '../../core/dominio/horario';
import { Coordenadas, Rubro } from '../../core/dominio/local';
import {
  describirDistancia,
  describirDuracion,
  DISTANCIA_MAXIMA_RUTA_METROS,
  distanciaEnMetros,
  ModoViaje,
  Ruta,
} from '../../core/dominio/ruta';
import { Locales, Reloj } from '../../core/estado';
import { Navegacion, Rutas, Ubicacion } from '../../core/puertos';
import { MapaLibre } from './mapa-libre';

type EstadoRuta = { tipo: 'cargando' } | { tipo: 'lista'; ruta: Ruta } | { tipo: 'error'; mensaje: string };

@Component({
  selector: 'app-mapa',
  imports: [MapaLibre, TarjetaLocal],
  templateUrl: './mapa.html',
  styleUrl: './mapa.scss',
})
export class Mapa {
  /** Local al que se quiere llegar; viene de `/mapa?ir=<id>` (botón "Ir" de la tarjeta). */
  readonly ir = input<string>();

  private readonly locales = inject(Locales);
  private readonly reloj = inject(Reloj);
  private readonly ubicacion = inject(Ubicacion);
  private readonly rutas = inject(Rutas);
  private readonly navegacion = inject(Navegacion);
  private readonly router = inject(Router);

  protected readonly rubro = signal<Rubro | null>(null);
  protected readonly soloAbiertos = signal(false);
  protected readonly seleccionado = signal<string | null>(null);
  protected readonly miPosicion = signal<Coordenadas | null>(null);
  protected readonly avisoUbicacion = signal('');

  protected readonly modo = signal<ModoViaje>('pie');
  protected readonly estadoRuta = signal<EstadoRuta | null>(null);
  /** Evita que una respuesta vieja pise a una más nueva al cambiar rápido de modo o de local. */
  private pedido = 0;

  /** Solo se ofrecen filtros de rubros que tienen locales. */
  protected readonly rubrosDisponibles = computed(() =>
    [...new Set(this.locales.todos().map((l) => l.rubro))].map((id) => ({ id, nombre: RUBROS[id].nombre })),
  );

  protected readonly visibles = computed(() =>
    this.locales.todos().filter(
      (l) =>
        (!this.rubro() || l.rubro === this.rubro()) &&
        (!this.soloAbiertos() || estadoApertura(l.horario, this.reloj.ahora()).tipo === 'abierto'),
    ),
  );

  protected readonly destino = computed(() => this.locales.todos().find((l) => l.id === this.ir()) ?? null);
  protected readonly rutaLista = computed(() => {
    const e = this.estadoRuta();
    return e?.tipo === 'lista' ? e.ruta : null;
  });
  protected readonly resumenRuta = computed(() => {
    const ruta = this.rutaLista();
    return ruta ? `${describirDistancia(ruta.metros)} · ${describirDuracion(ruta.segundos)}` : '';
  });
  protected readonly mensajeError = computed(() => {
    const e = this.estadoRuta();
    return e?.tipo === 'error' ? e.mensaje : '';
  });
  protected readonly urlExterna = computed(() => {
    const destino = this.destino();
    return destino ? this.navegacion.urlRuta(destino.ubicacion) : '';
  });

  constructor() {
    effect(() => {
      const destino = this.destino();
      const modo = this.modo();
      untracked(() => {
        if (destino) {
          this.seleccionado.set(destino.id);
          void this.calcularRuta(destino.ubicacion, modo);
        } else {
          this.pedido++;
          this.estadoRuta.set(null);
        }
      });
    });
  }

  protected elegir(id: string): void {
    this.seleccionado.set(id);
    document.getElementById('local-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  protected async ubicarme(): Promise<void> {
    this.avisoUbicacion.set('');
    try {
      this.miPosicion.set(await this.ubicacion.obtener());
    } catch (e) {
      this.avisoUbicacion.set(e instanceof Error ? e.message : 'No pudimos obtener tu ubicación.');
    }
  }

  protected cerrarRuta(): void {
    this.router.navigate([], { queryParams: { ir: null }, queryParamsHandling: 'merge' });
  }

  private async calcularRuta(destino: Coordenadas, modo: ModoViaje): Promise<void> {
    const pedido = ++this.pedido;
    this.estadoRuta.set({ tipo: 'cargando' });
    try {
      const origen = await this.ubicacion.obtener();
      if (pedido !== this.pedido) return;
      this.miPosicion.set(origen);
      if (distanciaEnMetros(origen, destino) > DISTANCIA_MAXIMA_RUTA_METROS) {
        throw new Error('Estás lejos de Bella Vista. Para este viaje conviene Google Maps.');
      }
      const ruta = await this.rutas.calcular(origen, destino, modo);
      if (pedido === this.pedido) this.estadoRuta.set({ tipo: 'lista', ruta });
    } catch (e) {
      if (pedido !== this.pedido) return;
      this.estadoRuta.set({ tipo: 'error', mensaje: e instanceof Error ? e.message : 'No pudimos calcular el recorrido.' });
    }
  }
}
