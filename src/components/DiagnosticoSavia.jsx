import { useState, useMemo, useEffect } from "react";
import { Filter, Gauge, Activity, Heart, AlertCircle } from "lucide-react";
import { ESTADOS_REF, estadoToRefKey, fmtFecha, TIPOS_MUESTRA } from "../lib/constants";
import { evaluateAllRatios, getHealthScore, countStatuses } from "../lib/savia-evaluator";
import SaviaScore from "./savia/SaviaScore";
import SaviaGauges from "./savia/SaviaGauges";
import SaviaRadar from "./savia/SaviaRadar";

/**
 * Pestaña de diagnóstico. Vista de salud nutricional con:
 *  - Score global de salud (0-100)
 *  - Gauges visuales por cada ratio y tejido
 *  - Radar de comparación con medición anterior
 *
 * Reusa toda la lógica existente:
 *  - registros (ya viene con ratios pre-calculados en meq/L)
 *  - rangos (de sap_rangos_ref, filtrados por estado fenológico)
 */
export default function DiagnosticoSavia({ profile, registros, empresas, rangos }) {
  const empresasUsuario = profile.rol === "admin"
    ? empresas
    : empresas.filter(e => e.id === profile.empresa_id);

  const [filtroEmpresa, setFiltroEmpresa] = useState(
    profile.rol !== "admin" ? profile.empresa_id : (empresasUsuario[0]?.id || "")
  );
  const [filtroPredio, setFiltroPredio] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const [vista, setVista] = useState("gauges"); // 'gauges' | 'radar'

  // Filtrar los registros según los selectores
  const baseRegs = useMemo(() => {
    let r = registros;
    if (filtroEmpresa) r = r.filter(x => x.empresaId === filtroEmpresa);
    if (filtroPredio) r = r.filter(x => x.predio === filtroPredio);
    if (filtroSector) r = r.filter(x => x.sector === filtroSector);
    return r;
  }, [registros, filtroEmpresa, filtroPredio, filtroSector]);

  const prediosOpts = useMemo(
    () => [...new Set(registros.filter(r => !filtroEmpresa || r.empresaId === filtroEmpresa).map(r => r.predio))].sort(),
    [registros, filtroEmpresa]
  );
  const sectoresOpts = useMemo(() => [...new Set(baseRegs.map(r => r.sector))].sort(), [baseRegs]);

  // Ordenar por fecha descendente y tomar las dos últimas mediciones
  const registrosOrdenados = useMemo(() => {
    return [...baseRegs].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [baseRegs]);

  const registroActual = registrosOrdenados[0] || null;
  const registroAnterior = registrosOrdenados[1] || null;

  // Auto-detectar estado fenológico de la medición actual
  const estadoKey = useMemo(() => {
    if (!registroActual?.estado) return "rac3_antesis";
    return estadoToRefKey(registroActual.estado) || "rac3_antesis";
  }, [registroActual?.estado]);

  // Evaluar todos los ratios para cada tejido
  const evaluaciones = useMemo(() => {
    if (!registroActual) return {};
    const out = {};
    for (const tejido of TIPOS_MUESTRA) {
      const medicion = registroActual[tejido.id];
      if (medicion) {
        out[tejido.id] = evaluateAllRatios(medicion, rangos, tejido.id, estadoKey);
      }
    }
    return out;
  }, [registroActual, rangos, estadoKey]);

  // Score global: combina todas las evaluaciones de todos los tejidos
  const { score, counts, total } = useMemo(() => {
    const allEvals = {};
    Object.entries(evaluaciones).forEach(([tejido, evs]) => {
      Object.entries(evs).forEach(([rel, ev]) => {
        allEvals[`${tejido}_${rel}`] = ev;
      });
    });
    return {
      score: getHealthScore(allEvals),
      counts: countStatuses(allEvals),
      total: Object.keys(allEvals).length
    };
  }, [evaluaciones]);

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 22 }}>
        <div className="label-eyebrow">Diagnóstico</div>
        <h1 className="display" style={{ fontSize: 30, fontWeight: 600, marginTop: 6, marginBottom: 0 }}>
          Salud <em style={{ fontStyle: "italic", color: "var(--green)" }}>nutricional</em>
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
          Evaluación visual de la última medición · ratios en meq/L vs banda óptima del estado fenológico
        </div>
      </div>

      {/* FILTROS */}
      <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Filter size={14} style={{ color: "var(--ink-3)", marginBottom: 12 }} />
        {profile.rol === "admin" && (
          <div style={{ minWidth: 200 }}>
            <label className="field-label">Empresa</label>
            <select
              className="select"
              value={filtroEmpresa}
              onChange={e => { setFiltroEmpresa(e.target.value); setFiltroPredio(""); setFiltroSector(""); }}
            >
              {empresasUsuario.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}
        <div style={{ minWidth: 180 }}>
          <label className="field-label">Predio</label>
          <select
            className="select"
            value={filtroPredio}
            onChange={e => { setFiltroPredio(e.target.value); setFiltroSector(""); }}
          >
            <option value="">Todos</option>
            {prediosOpts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="field-label">Sector</label>
          <select
            className="select"
            value={filtroSector}
            onChange={e => setFiltroSector(e.target.value)}
          >
            <option value="">Todos</option>
            {sectoresOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* SIN DATOS */}
      {!registroActual && (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <AlertCircle size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>No hay mediciones en el filtro seleccionado</div>
        </div>
      )}

      {/* CON DATOS */}
      {registroActual && (
        <>
          {/* CABECERA DEL REGISTRO */}
          <div className="card" style={{ padding: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div className="label-eyebrow">Medición evaluada</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                  <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>
                    {fmtFecha(registroActual.fecha)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {registroActual.predio} · {registroActual.sector}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                  {registroActual.variedad} · {registroActual.estado} · {registroActual.epoca}
                </div>
              </div>

              {registroAnterior && (
                <div style={{ textAlign: "right" }}>
                  <div className="label-eyebrow">Anterior</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginTop: 4 }}>
                    {fmtFecha(registroAnterior.fecha)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {registroAnterior.estado}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SCORE GLOBAL */}
          <div style={{ marginBottom: 18 }}>
            <SaviaScore score={score} counts={counts} total={total} />
          </div>

          {/* SELECTOR DE VISTA */}
          <div className="card" style={{ padding: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div className="label-eyebrow" style={{ fontSize: 9 }}>Vista</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "gauges", label: "Gauges",  icon: Gauge },
                { id: "radar",  label: "Radar",   icon: Activity }
              ].map(opt => {
                const Icon = opt.icon;
                const active = vista === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setVista(opt.id)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 12,
                      fontFamily: "Geist, sans-serif",
                      fontWeight: 500,
                      border: `1px solid ${active ? "var(--green)" : "var(--rule)"}`,
                      background: active ? "var(--green)" : "transparent",
                      color: active ? "var(--paper)" : "var(--ink-2)",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.12s",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-3)" }}>
              Banda de referencia: <span style={{ fontWeight: 600 }}>{ESTADOS_REF.find(e => e.key === estadoKey)?.label || "—"}</span>
            </div>
          </div>

          {/* VISTAS */}
          {vista === "gauges" && (
            <SaviaGauges
              evaluaciones={evaluaciones}
              mediciones={{
                joven: registroActual.joven,
                vieja: registroActual.vieja,
                lisimetro: registroActual.lisimetro
              }}
            />
          )}

          {vista === "radar" && (
            <SaviaRadar
              registroActual={registroActual}
              registroAnterior={registroAnterior}
              rangos={rangos}
              estadoKey={estadoKey}
            />
          )}
        </>
      )}
    </div>
  );
}
