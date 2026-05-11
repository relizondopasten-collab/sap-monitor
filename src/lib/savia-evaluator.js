// ─────────────────────────────────────────────────────────────────
//  Evaluador de ratios de savia
//
//  Toma los ratios ya calculados en meq/L (vienen de sap_mediciones
//  como columnas generated) y los compara contra los rangos de
//  sap_rangos_ref filtrados por tejido + estado fenológico.
//
//  Diseño:
//    - Funciones puras, sin estado
//    - No calcula ratios (eso ya lo hace la BD)
//    - No mantiene rangos hardcoded (vienen de getBanda)
//    - Solo asigna status: ok | below | above | no_data
// ─────────────────────────────────────────────────────────────────

import { RELACIONES, REL_UNIT } from "./constants";
import { getBanda } from "./db";

// Paleta de colores semáforo (consistente con el resto de la app)
export const STATUS_COLORS = {
  ok:      "#5E8D4E",  // verde (var(--green))
  below:   "#3B82F6",  // azul · por debajo del rango
  above:   "#D97706",  // ámbar · por encima del rango
  no_data: "#9CA3AF"   // gris · sin medición
};

export const STATUS_LABELS = {
  ok:      "En rango",
  below:   "Bajo",
  above:   "Alto",
  no_data: "Sin dato"
};

/**
 * Evalúa un solo valor contra una banda { min, max }.
 * @param {number|null} value - el valor del ratio
 * @param {{min, max}|null} banda - los límites OK (o null si no hay rango)
 * @returns {{status, value, banda}}
 */
export function evaluateRatio(value, banda) {
  if (value == null || isNaN(value)) {
    return { status: "no_data", value: null, banda };
  }
  if (!banda || banda.min == null || banda.max == null) {
    // Hay valor pero no hay rango definido → reportamos sin clasificar
    return { status: "no_data", value: +value, banda: null };
  }
  if (value < banda.min) return { status: "below", value: +value, banda };
  if (value > banda.max) return { status: "above", value: +value, banda };
  return { status: "ok", value: +value, banda };
}

/**
 * Evalúa TODOS los 5 ratios para una medición específica.
 *
 * @param {object|null} medicion - objeto con K/Ca, NO3/K, Na/K, Na/Ca, Brix/K
 *                                  (ya pre-calculados en meq/L por la BD)
 * @param {object|null} rangos - resultado de fetchRangos()
 * @param {string} tejido - 'joven' | 'vieja' | 'lisimetro'
 * @param {string} estadoKey - 'rac1_antesis' | ... | 'cosecha'
 * @returns {object} - { 'K/Ca': {status, value, banda}, 'NO3/K': {...}, ... }
 */
export function evaluateAllRatios(medicion, rangos, tejido, estadoKey) {
  const out = {};
  for (const rel of RELACIONES) {
    // Brix/K solo aplica a tejido foliar
    if (rel === "Brix/K" && tejido === "lisimetro") {
      continue;
    }
    const value = medicion?.[rel];
    const banda = getBanda(rangos, tejido, estadoKey, rel);
    out[rel] = evaluateRatio(value, banda);
    out[rel].unit = REL_UNIT[rel] || "";
  }
  return out;
}

/**
 * Calcula un score global de salud nutricional (0-100) a partir de la evaluación.
 *
 * Lógica:
 *   - ok      → 100 puntos
 *   - below   → 50 puntos (déficit leve)
 *   - above   → 50 puntos (exceso leve)
 *   - no_data → no cuenta (ni resta ni suma)
 *
 * Se promedia sobre los ratios con datos.
 */
export function getHealthScore(evaluaciones) {
  const points = { ok: 100, below: 50, above: 50 };
  let sum = 0;
  let count = 0;
  for (const ev of Object.values(evaluaciones)) {
    if (ev.status === "no_data") continue;
    sum += points[ev.status] ?? 0;
    count += 1;
  }
  if (count === 0) return null;
  return Math.round(sum / count);
}

/**
 * Cuenta los estados para mostrar conteo "3 OK · 1 alto · 1 sin dato"
 */
export function countStatuses(evaluaciones) {
  const counts = { ok: 0, below: 0, above: 0, no_data: 0 };
  for (const ev of Object.values(evaluaciones)) {
    counts[ev.status] = (counts[ev.status] || 0) + 1;
  }
  return counts;
}

/**
 * Calcula el delta (diferencia) entre dos mediciones para mostrar
 * tendencia. Útil para el radar de comparación.
 *
 * @param {object} medicionActual - última medición
 * @param {object} medicionAnterior - medición anterior (puede ser null)
 * @returns {object} - { 'K/Ca': delta, ... }  null si no hay anterior
 */
export function deltaRatios(medicionActual, medicionAnterior) {
  if (!medicionAnterior) return null;
  const out = {};
  for (const rel of RELACIONES) {
    const a = medicionActual?.[rel];
    const b = medicionAnterior?.[rel];
    if (a != null && b != null && !isNaN(a) && !isNaN(b)) {
      out[rel] = +(a - b).toFixed(2);
    } else {
      out[rel] = null;
    }
  }
  return out;
}

/**
 * Para el radar normalizado: cada ratio se mapea a 0-100 según su posición
 * en la banda óptima.
 *   - Si value está en banda → 50-100 (centro de banda = 100)
 *   - Si value < min → 0-50 según qué tan lejos
 *   - Si value > max → vuelve a bajar (overshoot)
 *
 * @returns {number} 0-100
 */
export function normalizeForRadar(value, banda) {
  if (value == null || !banda || banda.min == null || banda.max == null) return 0;
  const { min, max } = banda;
  const center = (min + max) / 2;
  const halfRange = (max - min) / 2;
  if (halfRange <= 0) return value >= min && value <= max ? 100 : 0;

  // Distancia normalizada respecto al centro de la banda
  const distance = Math.abs(value - center) / halfRange;
  // distance 0 → centro de banda → 100
  // distance 1 → borde de banda → 50
  // distance 2 → 2x lejos del centro → 0
  return Math.max(0, Math.min(100, Math.round(100 - distance * 50)));
}
