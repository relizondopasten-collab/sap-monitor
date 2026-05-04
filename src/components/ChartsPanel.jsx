import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea
} from "recharts";
import { Filter, BarChart3, Sprout, Leaf, Beaker } from "lucide-react";
import { TIPOS_MUESTRA, PARAM_INFO, RELACIONES, REL_UNIT, ESTADOS_REF, estadoToRefKey, inicioSemana, fmtFecha } from "../lib/constants";
import { getBanda } from "../lib/db";

const ICONOS = { joven: Sprout, vieja: Leaf, lisimetro: Beaker };

export default function ChartsPanel({ profile, registros, empresas, rangos }) {
  const empresasUsuario = profile.rol === "admin" ? empresas : empresas.filter(e => e.id === profile.empresa_id);
  const [filtroEmpresa, setFiltroEmpresa] = useState(profile.rol !== "admin" ? profile.empresa_id : (empresasUsuario[0]?.id || ""));
  const [filtroPredio, setFiltroPredio] = useState("");
  const [filtroSector, setFiltroSector] = useState("");
  const [bandaTipo, setBandaTipo] = useState("joven");
  const [estadoKey, setEstadoKey] = useState("rac3_antesis");

  const baseRegs = useMemo(() => {
    let r = registros;
    if (filtroEmpresa) r = r.filter(x => x.empresaId === filtroEmpresa);
    if (filtroPredio) r = r.filter(x => x.predio === filtroPredio);
    if (filtroSector) r = r.filter(x => x.sector === filtroSector);
    return r;
  }, [registros, filtroEmpresa, filtroPredio, filtroSector]);

  // Auto-detectar estado más frecuente en los registros filtrados
  useEffect(() => {
    if (baseRegs.length === 0) return;
    const counts = {};
    baseRegs.forEach(r => {
      const k = estadoToRefKey(r.estado);
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) setEstadoKey(top[0]);
  }, [baseRegs.length, filtroEmpresa, filtroPredio, filtroSector]);

  const prediosOpts  = useMemo(() => [...new Set(registros.filter(r => !filtroEmpresa || r.empresaId === filtroEmpresa).map(r => r.predio))].sort(), [registros, filtroEmpresa]);
  const sectoresOpts = useMemo(() => [...new Set(baseRegs.map(r => r.sector))].sort(), [baseRegs]);

  // Promedios semanales (lo hacemos en cliente para simplicidad,
  // luego se puede mover a la vista v_sap_promedios_semanales server-side)
  const semanalData = useMemo(() => {
    const map = {};
    baseRegs.forEach(r => {
      const wkStart = inicioSemana(r.fecha);
      if (!map[wkStart]) map[wkStart] = { semana: wkStart, _counts: {} };
      TIPOS_MUESTRA.forEach(t => {
        const m = r[t.id];
        if (!m) return;
        Object.keys(PARAM_INFO).forEach(p => {
          if (t.id === "lisimetro" && !PARAM_INFO[p].suelo) return;
          if (t.id !== "lisimetro" && !PARAM_INFO[p].savia) return;
          const v = m[p];
          if (v == null || isNaN(v)) return;
          const key = `${t.id}_${p}`;
          map[wkStart][key] = (map[wkStart][key] || 0) + parseFloat(v);
          map[wkStart]._counts[key] = (map[wkStart]._counts[key] || 0) + 1;
        });
        RELACIONES.forEach(rel => {
          const v = m[rel];
          if (v == null) return;
          if (rel === "Brix/K" && t.id === "lisimetro") return;
          const key = `${t.id}_${rel}`;
          map[wkStart][key] = (map[wkStart][key] || 0) + parseFloat(v);
          map[wkStart]._counts[key] = (map[wkStart]._counts[key] || 0) + 1;
        });
      });
    });
    const arr = Object.values(map).map(row => {
      const out = { semana: row.semana, semanaLabel: fmtFecha(row.semana) };
      Object.keys(row._counts).forEach(k => {
        out[k] = +(row[k] / row._counts[k]).toFixed(2);
      });
      return out;
    });
    return arr.sort((a, b) => a.semana.localeCompare(b.semana));
  }, [baseRegs]);

  const ultimo = baseRegs.length ? baseRegs.reduce((a, b) => a.fecha > b.fecha ? a : b) : null;

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 22 }}>
        <div className="label-eyebrow">Visualización</div>
        <h1 className="display" style={{ fontSize: 30, fontWeight: 600, marginTop: 6, marginBottom: 0 }}>
          Evolución <em style={{ fontStyle: "italic", color: "var(--green)" }}>semanal</em>
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
          Promedio por semana ISO · {baseRegs.length} registro{baseRegs.length !== 1 && "s"} en el filtro
        </div>
      </div>

      {/* FILTROS */}
      <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Filter size={14} style={{ color: "var(--ink-3)", marginBottom: 12 }} />
        {profile.rol === "admin" && (
          <div style={{ minWidth: 200 }}>
            <label className="field-label">Empresa</label>
            <select className="select" value={filtroEmpresa} onChange={e => { setFiltroEmpresa(e.target.value); setFiltroPredio(""); setFiltroSector(""); }}>
              {empresasUsuario.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}
        <div style={{ minWidth: 180 }}>
          <label className="field-label">Predio</label>
          <select className="select" value={filtroPredio} onChange={e => { setFiltroPredio(e.target.value); setFiltroSector(""); }}>
            <option value="">Todos</option>
            {prediosOpts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="field-label">Sector</label>
          <select className="select" value={filtroSector} onChange={e => setFiltroSector(e.target.value)}>
            <option value="">Todos</option>
            {sectoresOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* SELECTOR DE BANDA */}
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: bandaTipo !== "off" && bandaTipo !== "lisimetro" ? 12 : 0 }}>
          <div className="label-eyebrow" style={{ fontSize: 9 }}>Banda óptima · tejido</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[
              { id: "joven",     label: "Hoja joven" },
              { id: "vieja",     label: "Hoja vieja" },
              { id: "lisimetro", label: "Lisímetro" },
              { id: "off",       label: "Sin banda" }
            ].map(opt => {
              const active = bandaTipo === opt.id;
              return (
                <button key={opt.id} onClick={() => setBandaTipo(opt.id)}
                  style={{
                    padding: "6px 12px", fontSize: 12, fontFamily: "Geist, sans-serif", fontWeight: 500,
                    border: `1px solid ${active ? "var(--green)" : "var(--rule)"}`,
                    background: active ? "var(--green)" : "transparent",
                    color: active ? "var(--paper)" : "var(--ink-2)",
                    borderRadius: 3, cursor: "pointer", transition: "all 0.12s"
                  }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: "auto", maxWidth: 320, lineHeight: 1.4, textAlign: "right" }}>
            Cuadro 1 (Hochmuth · NovaCropControl · Peña 2015 · Hortus). Lisímetro: rangos genéricos.
          </div>
        </div>

        {bandaTipo !== "off" && bandaTipo !== "lisimetro" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingTop: 10, borderTop: "1px dashed var(--rule-2)" }}>
            <div className="label-eyebrow" style={{ fontSize: 9 }}>Estado fenológico</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {ESTADOS_REF.map(opt => {
                const active = estadoKey === opt.key;
                return (
                  <button key={opt.key} onClick={() => setEstadoKey(opt.key)}
                    style={{
                      padding: "5px 10px", fontSize: 11, fontFamily: "Geist, sans-serif", fontWeight: 500,
                      border: `1px solid ${active ? "var(--terra)" : "var(--rule)"}`,
                      background: active ? "rgba(160,82,45,0.10)" : "transparent",
                      color: active ? "var(--rust)" : "var(--ink-3)",
                      borderRadius: 3, cursor: "pointer", transition: "all 0.12s"
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: "auto" }}>
              Auto: estado más frecuente en los datos
            </div>
          </div>
        )}
      </div>

      {baseRegs.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <BarChart3 size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Aún no hay datos para graficar</div>
        </div>
      ) : (
        <>
          {ultimo && <UltimaMedicionCard r={ultimo} />}

          <h2 className="display" style={{ fontSize: 20, fontWeight: 600, marginTop: 28, marginBottom: 14 }}>
            Parámetros <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>medidos</em>
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {Object.keys(PARAM_INFO).map(p => (
              <ParamChart key={p} parametro={p} data={semanalData} bandaTipo={bandaTipo} estadoKey={estadoKey} rangos={rangos} />
            ))}
          </div>

          <h2 className="display" style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 14 }}>
            Relaciones <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>nutricionales</em>
          </h2>
          <div style={{ display: "grid", gap: 16 }}>
            {RELACIONES.map(r => (
              <RelChart key={r} relacion={r} data={semanalData} bandaTipo={bandaTipo} estadoKey={estadoKey} rangos={rangos} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UltimaMedicionCard({ r }) {
  return (
    <div className="card" style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="label-eyebrow">Última medición</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 600 }}>{fmtFecha(r.fecha)}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{r.predio} · {r.sector}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {r.variedad} · {r.estado} · {r.epoca}
          </div>
        </div>
      </div>

      <div className="grid-3">
        {TIPOS_MUESTRA.map(t => {
          const m = r[t.id];
          if (!m) return null;
          const Icon = ICONOS[t.id];
          return (
            <div key={t.id} className="card-tight" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Icon size={13} style={{ color: t.color }} />
                <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-2)", fontWeight: 600 }}>{t.label}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.keys(PARAM_INFO).map(p => {
                  if (t.id === "lisimetro" && !PARAM_INFO[p].suelo) return null;
                  if (t.id !== "lisimetro" && !PARAM_INFO[p].savia) return null;
                  const v = m[p];
                  if (v == null) return null;
                  return (
                    <div key={p}>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.04em" }}>{PARAM_INFO[p].label}</div>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{v}<span style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: 3 }}>{PARAM_INFO[p].unidad}</span></div>
                    </div>
                  );
                })}
              </div>
              <div className="rule-dotted" style={{ margin: "10px 0 8px 0" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11 }}>
                {RELACIONES.map(rel => {
                  if (rel === "Brix/K" && t.id === "lisimetro") return null;
                  const u = REL_UNIT[rel];
                  const v = m[rel];
                  return (
                    <div key={rel}>
                      <span style={{ color: "var(--ink-3)" }}>{rel}{u && <span style={{ fontSize: 9, opacity: 0.7 }}> · {u}</span>}: </span>
                      <span className="mono" style={{ fontWeight: 600, color: "var(--green)" }}>{v != null ? Number(v).toFixed(2) : "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParamChart({ parametro, data, bandaTipo, estadoKey, rangos }) {
  const seriesSavia = TIPOS_MUESTRA.filter(t => t.id !== "lisimetro" && PARAM_INFO[parametro].savia);
  const tieneLisimetro = PARAM_INFO[parametro].suelo;

  const tieneSavia = data.some(d => seriesSavia.some(s => d[`${s.id}_${parametro}`] != null));
  const tieneDataLis = tieneLisimetro && data.some(d => d[`lisimetro_${parametro}`] != null);
  if (!tieneSavia && !tieneDataLis) return null;

  // ¿Mostramos doble eje? Solo cuando hay datos de savia Y de lisímetro
  const dualAxis = tieneSavia && tieneDataLis;

  const banda = bandaTipo !== "off" ? getBanda(rangos, bandaTipo, estadoKey, parametro) : null;
  const tipoLabel = TIPOS_MUESTRA.find(t => t.id === bandaTipo)?.label;
  const estadoLabel = bandaTipo !== "lisimetro" ? ESTADOS_REF.find(s => s.key === estadoKey)?.label : null;
  const bandaEsLisimetro = bandaTipo === "lisimetro";

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{PARAM_INFO[parametro].label}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em" }}>{PARAM_INFO[parametro].unidad}</div>
        {dualAxis && (
          <div style={{ fontSize: 10, color: "var(--ink-3)", display: "flex", gap: 12 }}>
            <span><span style={{ color: "var(--green-2)" }}>━</span> savia · eje izq.</span>
            <span><span style={{ color: "var(--terra)" }}>━</span> lisímetro · eje der.</span>
          </div>
        )}
        {banda && (
          <div className="pill pill-green" style={{ marginLeft: "auto", fontSize: 10 }}>
            Óptimo {tipoLabel}{estadoLabel ? ` · ${estadoLabel}` : ""}: <span className="mono" style={{ marginLeft: 3 }}>{banda.min}–{banda.max}</span>
          </div>
        )}
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: dualAxis ? 4 : 16, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--rule-2)" strokeDasharray="2 4" />
            <XAxis dataKey="semanaLabel" tick={{ fontSize: 11, fill: "var(--ink-3)", fontFamily: "Geist Mono" }} stroke="var(--rule)" />

            {/* Eje izquierdo: savia (siempre) */}
            <YAxis
              yAxisId="savia"
              orientation="left"
              tick={{ fontSize: 11, fill: dualAxis ? "var(--green)" : "var(--ink-3)", fontFamily: "Geist Mono" }}
              stroke={dualAxis ? "var(--green-2)" : "var(--rule)"}
            />

            {/* Eje derecho: lisímetro (solo si hay dual) */}
            {dualAxis && (
              <YAxis
                yAxisId="lisimetro"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--terra)", fontFamily: "Geist Mono" }}
                stroke="var(--terra)"
              />
            )}

            {/* Banda de referencia · va sobre el eje correspondiente al tejido seleccionado */}
            {banda && (
              <ReferenceArea
                yAxisId={bandaEsLisimetro ? (dualAxis ? "lisimetro" : "savia") : "savia"}
                y1={banda.min} y2={banda.max}
                fill="rgba(94,141,78,0.14)" stroke="rgba(94,141,78,0.45)"
                strokeDasharray="3 3" ifOverflow="extendDomain"
              />
            )}

            <Tooltip
              contentStyle={{ background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 4, fontSize: 12, fontFamily: "Geist" }}
              labelStyle={{ fontWeight: 600, color: "var(--ink)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Geist" }} iconType="circle" />

            {/* Series de savia → eje izq */}
            {seriesSavia.map(s => (
              <Line key={s.id} yAxisId="savia" type="monotone"
                dataKey={`${s.id}_${parametro}`} name={s.label}
                stroke={s.color} strokeWidth={2}
                dot={{ r: 3, fill: s.color }} activeDot={{ r: 5 }} connectNulls />
            ))}

            {/* Serie de lisímetro → eje der (o izq si es la única) */}
            {tieneLisimetro && (
              <Line
                yAxisId={dualAxis ? "lisimetro" : "savia"}
                type="monotone"
                dataKey={`lisimetro_${parametro}`}
                name="Lisímetro"
                stroke="#A0522D"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: "#A0522D" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RelChart({ relacion, data, bandaTipo, estadoKey, rangos }) {
  const seriesSavia = TIPOS_MUESTRA.filter(t => t.id !== "lisimetro");
  // Brix/K solo aplica a savia
  const tieneLisimetro = relacion !== "Brix/K";

  const tieneSavia = data.some(d => seriesSavia.some(s => d[`${s.id}_${relacion}`] != null));
  const tieneDataLis = tieneLisimetro && data.some(d => d[`lisimetro_${relacion}`] != null);
  if (!tieneSavia && !tieneDataLis) return null;

  const dualAxis = tieneSavia && tieneDataLis;
  const unidad = REL_UNIT[relacion];

  const banda = bandaTipo !== "off" ? getBanda(rangos, bandaTipo, estadoKey, relacion) : null;
  const tipoLabel = TIPOS_MUESTRA.find(t => t.id === bandaTipo)?.label;
  const estadoLabel = bandaTipo !== "lisimetro" ? ESTADOS_REF.find(s => s.key === estadoKey)?.label : null;
  const bandaEsLisimetro = bandaTipo === "lisimetro";

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{relacion}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em" }}>{unidad ? unidad : "relación"}</div>
        {dualAxis && (
          <div style={{ fontSize: 10, color: "var(--ink-3)", display: "flex", gap: 12 }}>
            <span><span style={{ color: "var(--green-2)" }}>━</span> savia · eje izq.</span>
            <span><span style={{ color: "var(--terra)" }}>━</span> lisímetro · eje der.</span>
          </div>
        )}
        {banda && (
          <div className="pill pill-green" style={{ marginLeft: "auto", fontSize: 10 }}>
            Óptimo {tipoLabel}{estadoLabel ? ` · ${estadoLabel}` : ""}: <span className="mono" style={{ marginLeft: 3 }}>{banda.min}–{banda.max}</span>
          </div>
        )}
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: dualAxis ? 4 : 16, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--rule-2)" strokeDasharray="2 4" />
            <XAxis dataKey="semanaLabel" tick={{ fontSize: 11, fill: "var(--ink-3)", fontFamily: "Geist Mono" }} stroke="var(--rule)" />

            <YAxis
              yAxisId="savia"
              orientation="left"
              tick={{ fontSize: 11, fill: dualAxis ? "var(--green)" : "var(--ink-3)", fontFamily: "Geist Mono" }}
              stroke={dualAxis ? "var(--green-2)" : "var(--rule)"}
            />
            {dualAxis && (
              <YAxis
                yAxisId="lisimetro"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--terra)", fontFamily: "Geist Mono" }}
                stroke="var(--terra)"
              />
            )}

            {banda && (
              <ReferenceArea
                yAxisId={bandaEsLisimetro ? (dualAxis ? "lisimetro" : "savia") : "savia"}
                y1={banda.min} y2={banda.max}
                fill="rgba(94,141,78,0.14)" stroke="rgba(94,141,78,0.45)"
                strokeDasharray="3 3" ifOverflow="extendDomain"
              />
            )}

            <Tooltip
              contentStyle={{ background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 4, fontSize: 12, fontFamily: "Geist" }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Geist" }} iconType="circle" />

            {seriesSavia.map(s => (
              <Line key={s.id} yAxisId="savia" type="monotone"
                dataKey={`${s.id}_${relacion}`} name={s.label}
                stroke={s.color} strokeWidth={2}
                dot={{ r: 3, fill: s.color }} activeDot={{ r: 5 }} connectNulls />
            ))}

            {tieneLisimetro && (
              <Line
                yAxisId={dualAxis ? "lisimetro" : "savia"}
                type="monotone"
                dataKey={`lisimetro_${relacion}`}
                name="Lisímetro"
                stroke="#A0522D"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: "#A0522D" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
