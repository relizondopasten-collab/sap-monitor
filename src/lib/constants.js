// ─────────────────────────────────────────────────────────────────
//  CONSTANTES del dominio agronómico
// ─────────────────────────────────────────────────────────────────

export const EPOCAS = ["Otoño", "Invierno", "Primor", "Trastomate", "Verano"];

export const ESTADOS = [
  "Racimo 1 antesis", "Racimo 2 antesis", "Racimo 3 antesis", "Racimo 4 antesis",
  "Racimo 5 antesis", "Racimo 6 antesis", "Racimo 7 antesis",
  "Racimo 1 en cosecha", "Racimo 2 en cosecha", "Racimo 3 en cosecha",
  "Racimo 4 en cosecha", "Racimo 5 en cosecha", "Racimo 6 en cosecha",
  "Racimo 7 en cosecha", "Racimo 8 en cosecha", "Racimo 9 en cosecha"
];

// Tipos de muestra. id == columna 'tipo' en sap_mediciones
// Colores elegidos para máximo contraste entre series:
//   joven  → verde lima vivo (savia activa, hoja en crecimiento)
//   vieja  → violeta profundo (hoja madura, contraste fuerte vs joven)
//   lisímetro → terracota (separación clara del tejido vegetal)
export const TIPOS_MUESTRA = [
  { id: "joven",     label: "Hoja joven",     labelLargo: "Savia · Hoja joven",     color: "#7CB342" },
  { id: "vieja",     label: "Hoja vieja",     labelLargo: "Savia · Hoja vieja",     color: "#7B3F9E" },
  { id: "lisimetro", label: "Lisímetro",      labelLargo: "Lisímetro de succión",   color: "#A0522D" }
];

// Parámetros disponibles. db_col == columna en sap_mediciones
// step controla los decimales aceptados en el input numérico
export const PARAM_INFO = {
  NO3:  { label: "NO₃⁻", unidad: "ppm",   db_col: "no3",  step: "1",    savia: true,  suelo: true  },
  K:    { label: "K⁺",   unidad: "ppm",   db_col: "k",    step: "1",    savia: true,  suelo: true  },
  Ca:   { label: "Ca²⁺", unidad: "ppm",   db_col: "ca",   step: "1",    savia: true,  suelo: true  },
  Na:   { label: "Na⁺",  unidad: "ppm",   db_col: "na",   step: "1",    savia: true,  suelo: true  },
  CE:   { label: "CE",   unidad: "mS/cm", db_col: "ce",   step: "0.01", savia: true,  suelo: true  },
  pH:   { label: "pH",   unidad: "",      db_col: "ph",   step: "0.01", savia: true,  suelo: true  },
  Brix: { label: "Brix", unidad: "°Brix", db_col: "brix", step: "0.1",  savia: true,  suelo: false }
};

// Pesos equivalentes (g/eq) — usados solo en cliente para validación;
// las relaciones finales las calcula la base de datos en columnas generated.
export const PE = { K: 39.1, Ca: 20.04, Na: 22.99, NO3: 62.0 };

export const RELACIONES = ["K/Ca", "NO3/K", "Na/K", "Na/Ca", "Brix/K"];

export const REL_UNIT = {
  "K/Ca":   "meq/L",
  "NO3/K":  "meq/L",
  "Na/K":   "meq/L",
  "Na/Ca":  "meq/L",
  "Brix/K": ""
};

// Estados fenológicos para banda de referencia (Cuadro 1)
export const ESTADOS_REF = [
  { key: "rac1_antesis", label: "Racimo 1 antesis" },
  { key: "rac2_antesis", label: "Racimo 2 antesis" },
  { key: "rac3_antesis", label: "Racimo 3 antesis" },
  { key: "rac4_antesis", label: "Racimo 4 antesis" },
  { key: "rac5_antesis", label: "Racimo 5 antesis" },
  { key: "rac6_antesis", label: "Racimo 6 antesis" },
  { key: "cosecha",      label: "En cosecha (genérico)" }
];

// Mapea un estado del formulario a la clave del Cuadro 1
export function estadoToRefKey(estado) {
  if (!estado) return null;
  if (estado.toLowerCase().includes("antesis")) {
    const m = estado.match(/Racimo\s+(\d+)/i);
    if (!m) return null;
    let n = parseInt(m[1], 10);
    if (n > 6) n = 6;
    if (n < 1) n = 1;
    return `rac${n}_antesis`;
  }
  if (estado.toLowerCase().includes("cosecha")) return "cosecha";
  return null;
}

// Calcula relaciones meq/L localmente para vista previa en el formulario
// (la BD las recalcula vía generated columns al guardar)
export function calcRelaciones(m) {
  const empty = { "K/Ca": null, "NO3/K": null, "Na/K": null, "Na/Ca": null, "Brix/K": null };
  if (!m) return empty;
  const n = (v) => v !== "" && v != null && !isNaN(v) ? parseFloat(v) : null;
  const NO3 = n(m.NO3), K = n(m.K), Ca = n(m.Ca), Na = n(m.Na), Brix = n(m.Brix);

  const KmeqL   = K   != null ? K   / PE.K   : null;
  const CameqL  = Ca  != null ? Ca  / PE.Ca  : null;
  const NameqL  = Na  != null ? Na  / PE.Na  : null;
  const NO3meqL = NO3 != null ? NO3 / PE.NO3 : null;

  return {
    "K/Ca":   KmeqL   != null && CameqL != null && CameqL > 0 ? +(KmeqL   / CameqL).toFixed(2) : null,
    "NO3/K":  NO3meqL != null && KmeqL  != null && KmeqL  > 0 ? +(NO3meqL / KmeqL ).toFixed(2) : null,
    "Na/K":   NameqL  != null && KmeqL  != null && KmeqL  > 0 ? +(NameqL  / KmeqL ).toFixed(2) : null,
    "Na/Ca":  NameqL  != null && CameqL != null && CameqL > 0 ? +(NameqL  / CameqL).toFixed(2) : null,
    "Brix/K": Brix    != null && K      != null && K      > 0 ? +(Brix * 1000.0 / K).toFixed(2) : null
  };
}

// ── Utilidades de fecha ──
export function inicioSemana(fechaStr) {
  // Devuelve el lunes de la semana ISO de la fecha (yyyy-mm-dd)
  const d = new Date(fechaStr + "T12:00:00");
  const dia = d.getDay() || 7;
  d.setDate(d.getDate() - dia + 1);
  return d.toISOString().slice(0, 10);
}

export function fmtFecha(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
