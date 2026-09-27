import { Coordenada } from '../domain/models';

const RADIO_TIERRA_KM = 6371;

const rad = (grados: number) => (grados * Math.PI) / 180;

/** Distancia Haversine en kilómetros entre dos coordenadas. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

/** Interpolación lineal entre dos coordenadas (t: 0..1). */
export function interpolar(a: Coordenada, b: Coordenada, t: number): Coordenada {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/**
 * Genera una polilínea simulando calles: alterna tramos horizontales y
 * verticales con pequeñas desviaciones para que el mapa no dibuje una recta.
 */
export function generarRuta(origen: Coordenada, destino: Coordenada, puntos = 24): Coordenada[] {
  const ruta: Coordenada[] = [];
  for (let i = 0; i <= puntos; i++) {
    const t = i / puntos;
    const base = interpolar(origen, destino, t);
    const curva = Math.sin(t * Math.PI) * 0.0035;
    const zigzag = Math.sin(t * Math.PI * 6) * 0.0008;
    ruta.push({ lat: base.lat + curva + zigzag, lng: base.lng - curva * 0.55 + zigzag });
  }
  return ruta;
}

/** Punto de la ruta correspondiente a un porcentaje de avance (0..1). */
export function puntoEnRuta(ruta: Coordenada[], progreso: number): Coordenada {
  if (!ruta.length) return { lat: 0, lng: 0 };
  const clamped = Math.min(Math.max(progreso, 0), 1);
  const indice = clamped * (ruta.length - 1);
  const bajo = Math.floor(indice);
  const alto = Math.min(bajo + 1, ruta.length - 1);
  return interpolar(ruta[bajo], ruta[alto], indice - bajo);
}

/** Duración estimada en minutos para una distancia dada (velocidad urbana). */
export function duracionMin(km: number, velocidadKmh = 26): number {
  return Math.max(3, Math.round((km / velocidadKmh) * 60));
}
