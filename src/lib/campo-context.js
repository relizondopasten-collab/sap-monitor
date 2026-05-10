// ─────────────────────────────────────────────────────────────────
//  Carga del contexto del campo (predio, sector, último análisis de
//  agua, savia y lisímetro) a localStorage, para que los módulos
//  HTML standalone puedan leerlos sin necesidad de credenciales.
// ─────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import { fetchAnalisisAgua } from "./sapsoil-db";

// Lee el último registro de savia/lisímetro para una temporada (sector).
// Como el repo legacy usa "sap_registros" + "sap_mediciones", consultamos esas tablas.
async function fetchUltimosSapRegistros(predioId, sector) {
  // sap_registros (cabecera por fecha+sector+predio)
  let q = supabase
    .from("sap_registros")
    .select("id, fecha, predio_id, sector")
    .eq("predio_id", predioId)
    .order("fecha", { ascending: false })
    .limit(20);
  if (sector) q = q.eq("sector", sector);
  const { data: regs, error } = await q;
  if (error) {
    console.warn("[campo-context] No se pudieron leer sap_registros:", error.message);
    return { saviaJoven: null, saviaVieja: null, lisimetro: null };
  }
  if (!regs || regs.length === 0) {
    return { saviaJoven: null, saviaVieja: null, lisimetro: null };
  }

  const regIds = regs.map(r => r.id);
  const { data: meds, error: e2 } = await supabase
    .from("sap_mediciones")
    .select("registro_id, tipo, no3, k, ca, na, ce, ph, fecha")
    .in("registro_id", regIds);
  if (e2) {
    console.warn("[campo-context] No se pudieron leer sap_mediciones:", e2.message);
    return { saviaJoven: null, saviaVieja: null, lisimetro: null };
  }

  // Mapa registro_id → fecha
  const fechaPorReg = {};
  regs.forEach(r => { fechaPorReg[r.id] = r.fecha; });

  // Buscar la medición más reciente de cada tipo
  const masReciente = {};
  (meds || []).forEach(m => {
    const t = (m.tipo || "").toLowerCase();
    if (!t) return;
    const f = m.fecha || fechaPorReg[m.registro_id];
    const cur = masReciente[t];
    if (!cur || new Date(f) > new Date(cur._fecha)) {
      masReciente[t] = { ...m, _fecha: f };
    }
  });

  // Reconocer tipos comunes: hoja_joven / hoja_vieja / lisimetro
  const sj = masReciente["hoja_joven"] || masReciente["joven"] || masReciente["savia_joven"] || null;
  const sv = masReciente["hoja_vieja"] || masReciente["vieja"] || masReciente["savia_vieja"] || null;
  const li = masReciente["lisimetro"]  || masReciente["lisímetro"] || null;

  return {
    saviaJoven: sj ? { fecha: sj._fecha, no3: sj.no3, k: sj.k, ca: sj.ca, na: sj.na } : null,
    saviaVieja: sv ? { fecha: sv._fecha, no3: sv.no3, k: sv.k, ca: sv.ca, na: sv.na } : null,
    lisimetro:  li ? { fecha: li._fecha, ce: li.ce, ph: li.ph, no3: li.no3, k: li.k, na: li.na } : null
  };
}

// Carga TODO el contexto del campo a localStorage para los módulos HTML
export async function precargarContextoCampo({ predioId, predioNombre, sector, temporadaId } = {}) {
  if (!predioId) {
    // No hay predio activo → limpiar todo y salir
    localStorage.removeItem("sapsoil_contexto");
    localStorage.removeItem("sapsoil_ultimo_agua");
    localStorage.removeItem("sapsoil_ultimo_savia_joven");
    localStorage.removeItem("sapsoil_ultimo_savia_vieja");
    localStorage.removeItem("sapsoil_ultimo_lisimetro");
    return { ok: false, motivo: "sin_predio" };
  }

  // Contexto base
  localStorage.setItem("sapsoil_contexto", JSON.stringify({
    predio_id: predioId,
    predio_nombre: predioNombre || null,
    sector: sector || null,
    temporada_id: temporadaId || null,
    cargado_en: new Date().toISOString()
  }));

  try {
    // Último análisis de agua
    const aguas = await fetchAnalisisAgua(predioId);
    const ultAgua = aguas && aguas.length > 0 ? aguas[0] : null;
    if (ultAgua) {
      localStorage.setItem("sapsoil_ultimo_agua", JSON.stringify(ultAgua));
    } else {
      localStorage.removeItem("sapsoil_ultimo_agua");
    }

    // Últimos savia y lisímetro
    const sap = await fetchUltimosSapRegistros(predioId, sector);
    if (sap.saviaJoven) localStorage.setItem("sapsoil_ultimo_savia_joven", JSON.stringify(sap.saviaJoven));
    else localStorage.removeItem("sapsoil_ultimo_savia_joven");

    if (sap.saviaVieja) localStorage.setItem("sapsoil_ultimo_savia_vieja", JSON.stringify(sap.saviaVieja));
    else localStorage.removeItem("sapsoil_ultimo_savia_vieja");

    if (sap.lisimetro) localStorage.setItem("sapsoil_ultimo_lisimetro", JSON.stringify(sap.lisimetro));
    else localStorage.removeItem("sapsoil_ultimo_lisimetro");

    return { ok: true, agua: ultAgua, ...sap };
  } catch (err) {
    console.warn("[campo-context] Error precargando contexto:", err.message);
    return { ok: false, motivo: err.message };
  }
}

// Lee el contexto activo (si lo hay) — útil para mostrar en UI React
export function leerContextoActivo() {
  try {
    return JSON.parse(localStorage.getItem("sapsoil_contexto") || "null");
  } catch {
    return null;
  }
}

// Limpia todo el contexto
export function limpiarContextoCampo() {
  localStorage.removeItem("sapsoil_contexto");
  localStorage.removeItem("sapsoil_ultimo_agua");
  localStorage.removeItem("sapsoil_ultimo_savia_joven");
  localStorage.removeItem("sapsoil_ultimo_savia_vieja");
  localStorage.removeItem("sapsoil_ultimo_lisimetro");
}
