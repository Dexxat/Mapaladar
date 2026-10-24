# Mapaladar

Mapa gastronómico de Bella Vista. Angular 22, componentes standalone y signals.

## Cómo arrancar

Requiere **Node 24.15 o superior** (o Node 22.22.3+).

```bash
npm install
npm start          # abre en http://localhost:4200
npm test           # tests de horarios y rutas
```

La app se abre siempre desde `http://localhost:4200`: abrir `src/index.html` como archivo muestra una página en blanco.

Si cambiás `angular.json`, frená el servidor (Ctrl+C) y volvé a correr `npm start`: ese archivo solo se lee al arrancar. Si el mapa aparece vacío y sin botones de zoom, casi siempre es eso.

En la pantalla de bienvenida sirve cualquier email y una contraseña de 4 caracteres o más (sesión de prueba).

## Pantallas

| Ruta         | Qué hace                                                        |
|--------------|-----------------------------------------------------------------|
| `/`          | Bienvenida con email y contraseña                               |
| `/inicio`    | Opciones: mapa, favoritos y pedidos (próximamente)              |
| `/mapa`      | Mapa vectorial (MapLibre), filtros por rubro y "Abierto ahora"  |
| `/favoritos` | Locales marcados con el corazón                                 |

Las tres últimas requieren sesión (guard `conSesion`).

## Arquitectura

```
src/app/
├── core/                      Lógica, sin pantallas
│   ├── dominio/               Modelos y reglas puras (sin Angular)
│   │   ├── local.ts           Local, Rubro, Coordenadas
│   │   ├── horario.ts         estadoApertura(): abierto / cerrado / sin horario
│   │   ├── ruta.ts            Ruta, distancia en línea recta, "1,3 km · 18 min"
│   │   └── *.spec.ts
│   ├── datos/locales.data.ts  Los locales cargados a mano (hoy)
│   ├── puertos.ts             Contratos: LocalesRepositorio, Autenticacion,
│   │                          FavoritosRepositorio, Ubicacion, Rutas, Navegacion
│   ├── adaptadores.ts         Implementaciones actuales (memoria, localStorage,
│   │                          GPS del navegador, ruteo FOSSGIS, Google Maps)
│   ├── estado.ts              Locales, Favoritos y Reloj (signals)
│   └── guards.ts
├── compartido/                Piezas visuales reutilizables
│   ├── rubros.ts              Nombre, color y sprite de Piskel por rubro
│   ├── sprite.ts              <app-sprite>: anima una tira de Piskel
│   └── tarjeta-local.*        Box del local: estado, favorito, Pedir / Ir
└── pantallas/                 Una carpeta por ruta
    ├── bienvenida/  inicio/  favoritos/  marco/
    └── mapa/
        ├── mapa.*             Filtros y lista
        └── mapa-libre.ts      Único archivo que conoce MapLibre
```

### Conectar APIs más adelante

Las pantallas solo conocen los **puertos**. Cada uno se conecta a su implementación en `app.config.ts`:

```ts
{ provide: LocalesRepositorio, useClass: LocalesEnMemoria },
```

Para usar un backend, se crea `LocalesHttp extends LocalesRepositorio` (con `HttpClient`) y se cambia esa línea. Lo mismo vale para:

- **Autenticacion**: Firebase Auth, Supabase o un backend propio.
- **FavoritosRepositorio**: guardar favoritos en el servidor por usuario.
- **Ubicacion**: otro proveedor de GPS o una app nativa (Capacitor).
- **Rutas**: OpenRouteService o GraphHopper (con clave propia) en lugar del ruteo de FOSSGIS.
- **Navegacion**: Waze en lugar de Google Maps para el enlace externo.
- **Mapa**: reemplazar `mapa-libre.ts` por otro proveedor (Google Maps, Mapbox) manteniendo los mismos inputs y outputs.

## Cargar o editar locales

En `core/datos/locales.data.ts`. Los horarios van por día:

```ts
horario: {
  lun: [],                                     // cerrado
  sab: [{ abre: '11:30', cierra: '14:30' },    // dos franjas
        { abre: '19:30', cierra: '23:30' }],
  vie: [{ abre: '20:00', cierra: '01:30' }],   // pasa la medianoche
}
```

Si un local no tiene `horario`, la tarjeta muestra "Horario no disponible" (caso de Gurí por ahora).

Las coordenadas se ubicaron con las esquinas de OpenStreetMap (Valerio: Moine y Aconquija; Gurí: Entre Ríos y Dr. Mariano Moreno). Para ajustarlas, hacé clic derecho sobre el local en Google Maps y copiá los dos números. Ojo: Bella Vista está cerca de longitud **−58,69**; si un número empieza con −58,9 cae en General Rodríguez.

## Mapa

Usa [MapLibre GL JS](https://maplibre.org/) (código abierto) con el estilo vectorial gratuito de [OpenFreeMap](https://openfreemap.org/): no necesita registro ni clave. La librería se carga solo al entrar a `/mapa`.

Qué hace:

- Abre encuadrando todos los locales y no deja salir de Bella Vista y alrededores.
- Oculta los comercios del mapa base para que solo resalten los locales de Mapaladar.
- Los pines son botones accesibles (teclado y lector de pantalla); al elegir uno el mapa se desliza hasta el local.
- Controles en español (acercar, alejar, brújula), escala en metros y créditos compactos.

### Botón "Ir": cómo llegar sin salir de la app

"Ir" abre `/mapa?ir=<id del local>` (funciona igual desde Favoritos). El mapa pide la ubicación, calcula el recorrido por calles y lo dibuja: **punteado a pie, continuo en auto**. Un panel muestra distancia y tiempo, permite cambiar entre Caminando y Auto, y ofrece "Abrir en Google Maps" como alternativa.

- El recorrido lo calcula el servidor de ruteo de **FOSSGIS** (el mismo que usa openstreetmap.org): gratis y sin clave, pensado para uso moderado. Para producción conviene OpenRouteService o GraphHopper: se crea otra clase que extienda `Rutas` en `adaptadores.ts` y se cambia la línea en `app.config.ts`.
- Si el usuario está a más de 20 km, no se pide la ruta: el panel sugiere Google Maps (`DISTANCIA_MAXIMA_RUTA_METROS` en `ruta.ts`).
- Si el usuario no da permiso de ubicación, el panel lo explica y sigue ofreciendo Google Maps.

### Configurarlo

Todo está en el bloque `CONFIG` de `pantallas/mapa/mapa-libre.ts`:

| Opción                | Para qué sirve                                                      |
|-----------------------|---------------------------------------------------------------------|
| `estilo`              | Aspecto del mapa. `positron` (claro), `liberty` (color y edificios 3D) o `bright` |
| `ocultarPuntosAjenos` | Muestra u oculta comercios y paradas del mapa base                  |
| `limites`             | Rectángulo del que no se puede salir (oeste-sur, este-norte)        |
| `centro`, `zoom`      | Vista inicial si no hay locales                                     |
| `zoomMin`, `zoomMax`  | Cuánto se puede alejar o acercar                                    |
| `colorRuta`           | Color de la línea del recorrido                                     |

### El worker de MapLibre

MapLibre procesa las teselas en segundo plano con `maplibre-gl-worker.mjs`. `angular.json` lo copia a `maplibre/` y el componente lo indica con `setWorkerUrl`. Si se borra esa entrada de `assets`, el mapa queda en blanco. El CSS de MapLibre también se carga desde `angular.json` (`styles`).

## Sprites

Los PNG de `public/sprites/` salen de Piskel (tira horizontal, cuadros de 32×32 exportados al doble). Para sumar un rubro: agregar el PNG, el tipo en `Rubro` y su entrada en `compartido/rubros.ts`.

Sprites que no son rubros (`LOGO`, `CORAZON`) se declaran también en `rubros.ts` como `SpriteDef` con su cantidad de cuadros y velocidad (`fps`). Un GIF animado se convierte a tira PNG pegando sus cuadros uno al lado del otro a 64 px de alto.

## Créditos

Mapaladar se apoya en estos proyectos abiertos. Gracias a quienes los mantienen.

| Proyecto | Para qué lo usamos | Licencia |
|---|---|---|
| [Angular](https://angular.dev) | Framework de la aplicación | MIT |
| [RxJS](https://rxjs.dev) | Flujos de datos de los repositorios | Apache 2.0 |
| [MapLibre GL JS](https://maplibre.org) | Motor del mapa vectorial | BSD-3-Clause |
| [OpenFreeMap](https://openfreemap.org) | Estilo y teselas del mapa, sin clave | Gratuito, con atribución |
| [OpenMapTiles](https://openmaptiles.org) | Esquema de datos y estilo base de las teselas | BSD-3 (código) / CC-BY 4.0 (estilo) |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Calles, nombres y esquinas usadas para ubicar los locales | ODbL — © colaboradores de OpenStreetMap |
| [FOSSGIS](https://www.fossgis.de) — [routing.openstreetmap.de](https://routing.openstreetmap.de) | Servidor de ruteo del botón "Ir" | Servicio gratuito, uso moderado |
| [OSRM](https://project-osrm.org) | Motor de ruteo que corre en ese servidor | BSD-2-Clause |
| [Piskel](https://www.piskelapp.com) | Editor de los sprites animados | Apache 2.0 |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) y [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) | Tipografías, vía Google Fonts | SIL Open Font License |
| [Vitest](https://vitest.dev) | Tests unitarios | MIT |

El mapa muestra la atribución obligatoria de OpenFreeMap, OpenMapTiles y OpenStreetMap en el ícono ⓘ de la esquina inferior derecha: no hay que quitarla.
