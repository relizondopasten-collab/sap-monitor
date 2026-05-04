import { supabase } from "./supabase";
import { PARAM_INFO, TIPOS_MUESTRA } from "./constants";

// ─────────────────────────────────────────────────────────────────
//  Funciones de acceso a la BD — todo Supabase pasa por aquí
//  La RLS del backend filtra por rol/empresa, así que el cliente
//  no necesita pasar empresa_id a propósito en lecturas.
// ─────────────────────────────────────────────────────────────────

// ── EMPRESAS y PREDIOS ──
export async function fetchEmpresas() {
  const { data, error } = await supabase
    .from("empresas")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data || [];
}

export async function fetchPredios() {
  const { data, error } = await supabase
    .from("predios")
    .select("id, nombre, empresa_id")
    .order("nombre");
  if (error) throw error;
  return data || [];
}

// ── PERFIL del usuario actual ──
export async function fetchMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre, empresa_id, rol")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Predios asignados al usuario actual.
// [] = sin restricción (acceso a todos los predios de su empresa)
export async function fetchMyAssignedPredios() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profile_predios")
    .select("predio_id")
    .eq("profile_id", user.id);
  if (error) throw error;
  return (data || []).map(x => x.predio_id);
}

// ── REGISTROS ──
// Carga registros con sus mediciones. RLS filtra automáticamente.
export async function fetchRegistros() {
  const { data, error } = await supabase
    .from("sap_registros")
    .select(`
      id, fecha, empresa_id, predio_id, sector, epoca, variedad, estado,
      created_at, created_by,
      empresa:empresas ( nombre ),
      predio:predios ( nombre ),
      mediciones:sap_mediciones (
        id, tipo, no3, k, ca, na, ce, ph, brix,
        k_meq, ca_meq, na_meq, no3_meq,
        kca_meq, no3k_meq, nak_meq, naca_meq, brix_k
      )
    `)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeRegistro);
}

// Aplana joins y reorganiza mediciones en formato esperado por la UI:
//   r.joven, r.vieja, r.lisimetro como objetos directos
function normalizeRegistro(r) {
  const out = {
    id: r.id,
    fecha: r.fecha,
    empresaId: r.empresa_id,
    empresaNombre: r.empresa?.nombre ?? "",
    predioId: r.predio_id,
    predio: r.predio?.nombre ?? "",
    sector: r.sector,
    epoca: r.epoca,
    variedad: r.variedad,
    estado: r.estado,
    createdAt: r.created_at,
    createdBy: r.created_by,
    joven: null,
    vieja: null,
    lisimetro: null
  };
  for (const m of r.mediciones || []) {
    out[m.tipo] = {
      id: m.id,
      NO3: m.no3, K: m.k, Ca: m.ca, Na: m.na, CE: m.ce, pH: m.ph, Brix: m.brix,
      K_meq: m.k_meq, Ca_meq: m.ca_meq, Na_meq: m.na_meq, NO3_meq: m.no3_meq,
      "K/Ca":   m.kca_meq,
      "NO3/K":  m.no3k_meq,
      "Na/K":   m.nak_meq,
      "Na/Ca":  m.naca_meq,
      "Brix/K": m.brix_k
    };
  }
  return out;
}

// Crea registro + mediciones en una operación.
// payload: { fecha, empresa_id, predio_id, sector, epoca, variedad, estado,
//            muestras: { joven|vieja|lisimetro: { NO3, K, Ca, Na, CE, pH, Brix } } }
export async function createRegistro(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");

  // 1) Insert del registro padre
  const { data: reg, error: e1 } = await supabase
    .from("sap_registros")
    .insert({
      fecha:       payload.fecha,
      empresa_id:  payload.empresa_id,
      predio_id:   payload.predio_id,
      sector:      payload.sector,
      epoca:       payload.epoca,
      variedad:    payload.variedad,
      estado:      payload.estado,
      created_by:  user.id
    })
    .select("id")
    .single();
  if (e1) throw e1;

  // 2) Insert de mediciones (solo las muestras con al menos un valor)
  const filas = [];
  for (const tipo of TIPOS_MUESTRA.map(t => t.id)) {
    const m = payload.muestras?.[tipo];
    if (!m) continue;
    const tieneAlgo = Object.values(m).some(v => v !== "" && v != null);
    if (!tieneAlgo) continue;
    filas.push({
      registro_id: reg.id,
      tipo,
      no3:  toNum(m.NO3),
      k:    toNum(m.K),
      ca:   toNum(m.Ca),
      na:   toNum(m.Na),
      ce:   toNum(m.CE),
      ph:   toNum(m.pH),
      brix: tipo === "lisimetro" ? null : toNum(m.Brix)
    });
  }
  if (filas.length === 0) {
    // rollback manual: eliminamos el registro huérfano
    await supabase.from("sap_registros").delete().eq("id", reg.id);
    throw new Error("Ingresa al menos una medición");
  }
  const { error: e2 } = await supabase.from("sap_mediciones").insert(filas);
  if (e2) {
    await supabase.from("sap_registros").delete().eq("id", reg.id);
    throw e2;
  }
  return reg.id;
}

export async function deleteRegistro(id) {
  // sap_mediciones borra en cascada por la FK
  const { error } = await supabase.from("sap_registros").delete().eq("id", id);
  if (error) throw error;
}

// ── RANGOS DE REFERENCIA ──
let _rangosCache = null;
export async function fetchRangos() {
  if (_rangosCache) return _rangosCache;
  const { data, error } = await supabase
    .from("sap_rangos_ref")
    .select("tejido, estado_key, parametro, min_val, max_val");
  if (error) throw error;
  // Estructura: out[tejido][estadoKey || '__none__'][param] = { min, max }
  const out = { joven: {}, vieja: {}, lisimetro: {} };
  for (const r of data || []) {
    const bucket = r.tejido === "lisimetro" ? "__none__" : r.estado_key;
    if (!out[r.tejido][bucket]) out[r.tejido][bucket] = {};
    out[r.tejido][bucket][r.parametro] = { min: r.min_val, max: r.max_val };
  }
  _rangosCache = out;
  return out;
}

export function getBanda(rangos, tejido, estadoKey, param) {
  if (!rangos || !rangos[tejido]) return null;
  const bucket = tejido === "lisimetro" ? "__none__" : estadoKey;
  return rangos[tejido][bucket]?.[param] || null;
}

// Helper interno
function toNum(v) {
  if (v === "" || v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
