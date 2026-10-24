import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  LngLatBounds,
  Map as MapaGL,
  Marker,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type LngLatBoundsLike,
} from 'maplibre-gl';
import type { Feature } from 'geojson';
import { Coordenadas, Local } from '../../core/dominio/local';
import { ModoViaje, Ruta } from '../../core/dominio/ruta';
import { estiloSprite, RUBROS } from '../../compartido/rubros';

/** Ajustes visuales del mapa: cambiá estos valores para darle otro aspecto. */
const CONFIG = {
  /**
   * Estilo vectorial gratuito y sin clave de OpenFreeMap. Otros: 'liberty' (más color, edificios 3D)
   * o 'bright'. Cambiá solo el final de la URL.
   */
  estilo: 'https://tiles.openfreemap.org/styles/positron',
  /** Oculta comercios y paradas del mapa base para que solo resalten los locales de Mapaladar. */
  ocultarPuntosAjenos: true,
  /** Rectángulo del que el usuario no puede salir: Bella Vista y alrededores (oeste-sur, este-norte). */
  limites: [[-58.73, -34.59], [-58.64, -34.53]] as LngLatBoundsLike,
  /** Vista inicial si todavía no hay locales para encuadrar. */
  centro: [-58.685, -34.562] as [number, number],
  zoom: 15,
  zoomMin: 13,
  zoomMax: 19,
  colorRuta: '#2a6fdb',
};

/**
 * Único lugar de la app que conoce MapLibre. Para cambiar de proveedor se reemplaza este
 * componente manteniendo sus inputs y outputs.
 */
@Component({
  selector: 'app-mapa-libre',
  template: `<div #lienzo class="lienzo"></div>`,
  styles: `
    :host { display: block; position: relative; }
    .lienzo { position: absolute; inset: 0; }
  `,
})
export class MapaLibre {
  readonly locales = input.required<Local[]>();
  readonly seleccionado = input<string | null>(null);
  readonly miPosicion = input<Coordenadas | null>(null);
  readonly ruta = input<Ruta | null>(null);
  readonly modoRuta = input<ModoViaje>('pie');
  readonly elegir = output<string>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: MapaGL;
  private marcadores: Marker[] = [];
  private marcadorYo?: Marker;
  /** True desde el evento `load`; `isStyleLoaded()` no sirve porque da false mientras bajan teselas. */
  private estiloListo = false;

  constructor() {
    afterNextRender(() => {
      // El worker se publica como asset (ver angular.json) porque el bundle no lo trae adentro.
      setWorkerUrl(new URL('maplibre/maplibre-gl-worker.mjs', document.baseURI).href);

      const encuadre = this.encuadrarLocales();
      this.mapa = new MapaGL({
        container: this.lienzo().nativeElement,
        style: CONFIG.estilo,
        center: CONFIG.centro,
        zoom: CONFIG.zoom,
        minZoom: CONFIG.zoomMin,
        maxZoom: CONFIG.zoomMax,
        maxBounds: CONFIG.limites,
        bounds: encuadre ?? undefined,
        fitBoundsOptions: { padding: 80, maxZoom: 16 },
        attributionControl: { compact: true },
        locale: {
          'NavigationControl.ZoomIn': 'Acercar',
          'NavigationControl.ZoomOut': 'Alejar',
          'NavigationControl.ResetBearing': 'Apuntar al norte',
        },
      });
      this.mapa.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
      this.mapa.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
      this.mapa.on('load', () => {
        this.estiloListo = true;
        this.prepararEstilo();
        this.pintarRuta();
      });
      this.dibujarLocales();
    });

    inject(DestroyRef).onDestroy(() => this.mapa?.remove());

    effect(() => {
      this.locales();
      this.seleccionado();
      this.dibujarLocales();
    });

    effect(() => {
      const pos = this.miPosicion();
      if (!this.mapa || !pos) return;
      this.marcadorYo?.remove();
      const punto = document.createElement('div');
      punto.className = 'pin-yo';
      punto.setAttribute('role', 'img');
      punto.setAttribute('aria-label', 'Tu ubicación');
      this.marcadorYo = new Marker({ element: punto }).setLngLat([pos.lng, pos.lat]).addTo(this.mapa);
      if (!this.ruta()) this.mapa.flyTo({ center: [pos.lng, pos.lat], zoom: 16 });
    });

    effect(() => {
      this.ruta();
      this.modoRuta();
      this.pintarRuta();
    });

    effect(() => {
      const local = this.locales().find((l) => l.id === this.seleccionado());
      if (this.mapa && local && !this.ruta()) {
        this.mapa.easeTo({ center: [local.ubicacion.lng, local.ubicacion.lat], zoom: Math.max(this.mapa.getZoom(), 16) });
      }
    });
  }

  /** Rectángulo que contiene a todos los locales, o null si no hay ninguno. */
  private encuadrarLocales(): LngLatBounds | null {
    const locales = this.locales();
    if (!locales.length) return null;
    const caja = new LngLatBounds();
    for (const l of locales) caja.extend([l.ubicacion.lng, l.ubicacion.lat]);
    return caja;
  }

  /**
   * Dibuja la ruta actual (o la borra) y encuadra el recorrido. Si el estilo todavía no cargó,
   * no hace nada: el evento `load` la vuelve a llamar.
   */
  private pintarRuta(): void {
    const mapa = this.mapa;
    if (!mapa || !this.estiloListo) return;
    const ruta = this.ruta();
    const linea: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: (ruta?.puntos ?? []).map((p) => [p.lng, p.lat]) },
    };

    const fuente = mapa.getSource<GeoJSONSource>('ruta');
    if (fuente) fuente.setData(linea);
    else {
      mapa.addSource('ruta', { type: 'geojson', data: linea });
      const primeraEtiqueta = mapa.getStyle().layers.find((c) => c.type === 'symbol')?.id;
      mapa.addLayer(
        {
          id: 'ruta-borde',
          type: 'line',
          source: 'ruta',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 9 },
        },
        primeraEtiqueta,
      );
      mapa.addLayer(
        {
          id: 'ruta-linea',
          type: 'line',
          source: 'ruta',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': CONFIG.colorRuta, 'line-width': 5 },
        },
        primeraEtiqueta,
      );
    }
    // A pie: línea de puntos; en auto: continua.
    mapa.setPaintProperty('ruta-linea', 'line-dasharray', this.modoRuta() === 'pie' ? [0, 2] : [1, 0]);

    if (!ruta?.puntos.length) return;
    const caja = new LngLatBounds();
    for (const p of ruta.puntos) caja.extend([p.lng, p.lat]);
    mapa.fitBounds(caja, { padding: { top: 200, bottom: 70, left: 50, right: 70 }, maxZoom: 17 });
  }

  /** Ajustes que dependen del estilo cargado. */
  private prepararEstilo(): void {
    const mapa = this.mapa!;
    if (!CONFIG.ocultarPuntosAjenos) return;
    for (const capa of mapa.getStyle().layers) {
      if ('source-layer' in capa && capa['source-layer'] === 'poi') mapa.setLayoutProperty(capa.id, 'visibility', 'none');
    }
  }

  private dibujarLocales(): void {
    if (!this.mapa) return;
    for (const m of this.marcadores) m.remove();
    this.marcadores = this.locales().map((local) => {
      const rubro = RUBROS[local.rubro];
      const activo = local.id === this.seleccionado();
      // Botón real: se puede elegir con teclado y lo anuncian los lectores de pantalla.
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'pin-boton';
      boton.setAttribute('aria-label', local.nombre);
      boton.setAttribute('aria-pressed', String(activo));
      boton.innerHTML =
        `<div class="pin${activo ? ' activo' : ''}" style="--color:${rubro.color}">` +
        `<span class="sprite" style="${estiloSprite(rubro.sprite, 48)}"></span></div>`;
      boton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.elegir.emit(local.id);
      });
      if (activo) boton.style.zIndex = '1';
      return new Marker({ element: boton, anchor: 'bottom', offset: [0, -7] })
        .setLngLat([local.ubicacion.lng, local.ubicacion.lat])
        .addTo(this.mapa!);
    });
  }
}
