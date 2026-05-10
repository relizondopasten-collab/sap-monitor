import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────────────
//  Funciones de acceso a las tablas sapsoil_*
//  Complementan db.js (savia/lisímetro existente)
//  La RLS del backend filtra automáticamente por empresa/asignaciones
// ─────────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════
//  TEMPORADAS · ciclo productivo (contenedor de planes y resultados)
// ════════════════════════════════════════════════════════════════

export async function fetchTemporadas(predioId = null) {
  let q = supabase
    .from("sapsoil_temporadas")
    .select("id, predio_id, sector, nombre, cultivo, variedad, epoca, fecha_plantacion, fecha_fin_estimada, fecha_fin_real, estado, num_racimos_objetivo, ejes_ha, vida_util_objetivo_dias")
    .order("fecha_plantacion", { ascending: false });
  if (predioId) q = q.eq("predio_id", predioId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchTemporadaById(id) {
  const { data, error } = await supabase
    .from("sapsoil_temporadas")
    .select("*, predio:predios(nombre, empresa_id, empresa:empresas(nombre))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTemporada(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_temporadas")
    .insert({ ...payload, created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateTemporada(id, changes) {
  const { error } = await supabase
    .from("sapsoil_temporadas")
    .update(changes)
    .eq("id", id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════
//  ANÁLISIS DE LABORATORIO
// ════════════════════════════════════════════════════════════════

export async function fetchAnalisisSuelo(predioId = null) {
  let q = supabase
    .from("sapsoil_analisis_suelo")
    .select("*")
    .order("fecha", { ascending: false });
  if (predioId) q = q.eq("predio_id", predioId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createAnalisisSuelo(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_analisis_suelo")
    .insert({ ...payload, registrado_por: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchAnalisisExtracto(predioId = null) {
  let q = supabase
    .from("sapsoil_analisis_extracto")
    .select("*")
    .order("fecha", { ascending: false });
  if (predioId) q = q.eq("predio_id", predioId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchAnalisisAgua(predioId = null) {
  let q = supabase
    .from("sapsoil_analisis_agua")
    .select("*")
    .order("fecha", { ascending: false });
  if (predioId) q = q.eq("predio_id", predioId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ════════════════════════════════════════════════════════════════
//  RECETAS DE FERTIRRIEGO
// ════════════════════════════════════════════════════════════════

export async function fetchRecetas(temporadaId) {
  const { data, error } = await supabase
    .from("sapsoil_recetas_fertirriego")
    .select("*")
    .eq("temporada_id", temporadaId)
    .order("racimo");
  if (error) throw error;
  return data || [];
}

export async function saveReceta(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_recetas_fertirriego")
    .upsert({ ...payload, registrado_por: user.id }, {
      onConflict: "temporada_id,racimo,origen"
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ════════════════════════════════════════════════════════════════
//  POST-COSECHA Y APLICACIONES FOLIARES
// ════════════════════════════════════════════════════════════════

export async function fetchPostCosecha(temporadaId) {
  const { data, error } = await supabase
    .from("sapsoil_registros_postcosecha")
    .select("*")
    .eq("temporada_id", temporadaId)
    .order("fecha_cosecha", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPostCosecha(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_registros_postcosecha")
    .insert({ ...payload, registrado_por: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchAplicacionesFoliares(temporadaId) {
  const { data, error } = await supabase
    .from("sapsoil_aplicaciones_foliares")
    .select("*")
    .eq("temporada_id", temporadaId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAplicacionFoliar(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_aplicaciones_foliares")
    .insert({ ...payload, registrado_por: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ════════════════════════════════════════════════════════════════
//  ENMIENDAS APLICADAS
// ════════════════════════════════════════════════════════════════

export async function fetchEnmiendasAplicadas(predioId) {
  const { data, error } = await supabase
    .from("sapsoil_enmiendas_aplicadas")
    .select("*")
    .eq("predio_id", predioId)
    .order("fecha_aplicacion", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEnmiendaAplicada(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { data, error } = await supabase
    .from("sapsoil_enmiendas_aplicadas")
    .insert({ ...payload, registrado_por: user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ════════════════════════════════════════════════════════════════
//  CATÁLOGOS COMPARTIDOS (read-only para todos los autenticados)
// ════════════════════════════════════════════════════════════════

let _catFertCache = null;
export async function fetchCatalogoFertilizantes(force = false) {
  if (_catFertCache && !force) return _catFertCache;
  const { data, error } = await supabase
    .from("sapsoil_catalogo_fertilizantes")
    .select("*")
    .eq("activo", true)
    .order("categoria")
    .order("nombre");
  if (error) throw error;
  _catFertCache = data || [];
  return _catFertCache;
}

let _catEnmCache = null;
export async function fetchCatalogoEnmiendas(force = false) {
  if (_catEnmCache && !force) return _catEnmCache;
  const { data, error } = await supabase
    .from("sapsoil_catalogo_enmiendas")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  _catEnmCache = data || [];
  return _catEnmCache;
}

let _catFolCache = null;
export async function fetchCatalogoFoliares(force = false) {
  if (_catFolCache && !force) return _catFolCache;
  const { data, error } = await supabase
    .from("sapsoil_catalogo_foliares")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  _catFolCache = data || [];
  return _catFolCache;
}

// Limpia los caches (útil después de que admin edite catálogos)
export function clearCatalogoCaches() {
  _catFertCache = null;
  _catEnmCache = null;
  _catFolCache = null;
}
