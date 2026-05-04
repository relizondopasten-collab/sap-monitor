import { useState, useEffect, useMemo } from "react";
import {
  Sprout, Leaf, Beaker, Calendar, AlertCircle, Check, RotateCcw, ShieldCheck
} from "lucide-react";
import { EPOCAS, ESTADOS, TIPOS_MUESTRA, PARAM_INFO, RELACIONES, REL_UNIT, calcRelaciones } from "../lib/constants";
import { createRegistro } from "../lib/db";

const ICONOS = { joven: Sprout, vieja: Leaf, lisimetro: Beaker };

export default function EntryForm({ profile, empresas, predios, assignedPredioIds, onSaved }) {
  // Empresa: admin elige; encargado/gerente fijos a su empresa
  const empresasDisponibles = profile.rol === "admin" ? empresas : empresas.filter(e => e.id === profile.empresa_id);

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [empresaId, setEmpresaId] = useState(empresasDisponibles[0]?.id || "");
  const [predioId, setPredioId] = useState("");
  const [sector, setSector] = useState("");
  const [epoca, setEpoca] = useState("");
  const [variedad, setVariedad] = useState("");
  const [estado, setEstado] = useState("");
  const [muestras, setMuestras] = useState({
    joven:     { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "", Brix: "" },
    vieja:     { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "", Brix: "" },
    lisimetro: { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "" }
  });
  const [activos, setActivos] = useState({ joven: true, vieja: true, lisimetro: true });
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const empresa = empresas.find(e => e.id === empresaId);

  // Predios disponibles según rol y asignaciones
  const prediosDisponibles = useMemo(() => {
    let lista = predios.filter(p => p.empresa_id === empresaId);
    if (profile.rol === "encargado" && assignedPredioIds && assignedPredioIds.length > 0) {
      lista = lista.filter(p => assignedPredioIds.includes(p.id));
    }
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [predios, empresaId, profile.rol, assignedPredioIds]);

  // Auto-selección si solo hay un predio
  useEffect(() => {
    if (prediosDisponibles.length === 1 && !predioId) {
      setPredioId(prediosDisponibles[0].id);
    }
  }, [empresaId, prediosDisponibles.length]);

  const updateMuestra = (tipo, param, valor) => {
    setMuestras(prev => ({ ...prev, [tipo]: { ...prev[tipo], [param]: valor } }));
  };

  const limpiar = () => {
    setMuestras({
      joven:     { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "", Brix: "" },
      vieja:     { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "", Brix: "" },
      lisimetro: { NO3: "", K: "", Ca: "", Na: "", CE: "", pH: "" }
    });
  };

  const guardar = async () => {
    if (!empresaId || !predioId || !sector || !epoca || !variedad || !estado) {
      setFeedback("Completa todos los campos de identificación");
      return;
    }
    const muestrasFinales = {};
    let alguna = false;
    for (const t of TIPOS_MUESTRA) {
      if (!activos[t.id]) continue;
      const m = muestras[t.id];
      const tieneAlgo = Object.values(m).some(v => v !== "" && v != null);
      if (tieneAlgo) {
        muestrasFinales[t.id] = { ...m };
        alguna = true;
      }
    }
    if (!alguna) {
      setFeedback("Ingresa al menos una medición");
      return;
    }

    setBusy(true);
    setFeedback("");
    try {
      await createRegistro({
        fecha,
        empresa_id: empresaId,
        predio_id: predioId,
        sector: sector.trim(),
        epoca,
        variedad: variedad.trim(),
        estado,
        muestras: muestrasFinales
      });
      setFeedback("✓ Registro guardado");
      limpiar();
      onSaved && onSaved();
      setTimeout(() => setFeedback(""), 2500);
    } catch (err) {
      console.error(err);
      setFeedback("Error: " + (err.message || "no se pudo guardar"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="label-eyebrow">Nuevo registro</div>
        <h1 className="display" style={{ fontSize: 32, fontWeight: 600, marginTop: 6, marginBottom: 0 }}>
          Mediciones <em style={{ fontStyle: "italic", color: "var(--green)" }}>de la jornada</em>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 14, marginTop: 8 }}>
          Completa la identificación y los valores leídos. Las relaciones se calculan automáticamente al guardar.
        </p>
      </div>

      {/* IDENTIFICACIÓN */}
      <section className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Calendar size={14} style={{ color: "var(--green)" }} />
          <div className="label-eyebrow">Identificación</div>
        </div>

        <div className="grid-3" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="input mono" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Empresa</label>
            {profile.rol === "admin" ? (
              <select className="select" value={empresaId}
                onChange={e => { setEmpresaId(e.target.value); setPredioId(""); }}>
                {empresasDisponibles.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            ) : (
              <div className="input" style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(94,141,78,0.08)",
                borderColor: "var(--green-2)",
                color: "var(--green)",
                fontWeight: 500,
                cursor: "not-allowed"
              }}>
                <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {empresa?.nombre || "—"}
                </span>
                <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>asignada</span>
              </div>
            )}
          </div>
          <div>
            <label className="field-label">Predio</label>
            <select className="select" value={predioId} onChange={e => setPredioId(e.target.value)}>
              <option value="">— selecciona —</option>
              {prediosDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">Sector predial</label>
            <input className="input" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ej. MOD 7, Naves 1-3" />
          </div>
          <div>
            <label className="field-label">Época de cultivo</label>
            <select className="select" value={epoca} onChange={e => setEpoca(e.target.value)}>
              <option value="">— selecciona —</option>
              {EPOCAS.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Variedad</label>
            <input className="input" value={variedad} onChange={e => setVariedad(e.target.value)} placeholder="Ej. Moria, Aníbal" />
          </div>
        </div>

        <div>
          <label className="field-label">Estado de desarrollo</label>
          <select className="select" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">— selecciona racimo / fase —</option>
            <optgroup label="Antesis">
              {ESTADOS.filter(s => s.includes("antesis")).map(x => <option key={x} value={x}>{x}</option>)}
            </optgroup>
            <optgroup label="En cosecha">
              {ESTADOS.filter(s => s.includes("cosecha")).map(x => <option key={x} value={x}>{x}</option>)}
            </optgroup>
          </select>
        </div>
      </section>

      {/* MUESTRAS */}
      {TIPOS_MUESTRA.map(tipo => {
        const Icon = ICONOS[tipo.id];
        const params = tipo.id === "lisimetro"
          ? Object.keys(PARAM_INFO).filter(p => PARAM_INFO[p].suelo)
          : Object.keys(PARAM_INFO).filter(p => PARAM_INFO[p].savia);
        const m = muestras[tipo.id];
        const rels = calcRelaciones(m);
        const isActive = activos[tipo.id];

        return (
          <section key={tipo.id} className="card" style={{ padding: 22, marginBottom: 18, opacity: isActive ? 1 : 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 4, background: tipo.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Icon size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{tipo.labelLargo}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {tipo.id === "lisimetro" ? "Solución de suelo · sin Brix" : "Petíolo / lámina"}
                  </div>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--ink-2)" }}>
                <input type="checkbox" checked={isActive} onChange={e => setActivos(prev => ({ ...prev, [tipo.id]: e.target.checked }))} />
                medir
              </label>
            </div>

            {isActive && (
              <>
                <div className="grid-params">
                  {params.map(p => (
                    <div key={p}>
                      <label className="field-label">
                        {PARAM_INFO[p].label} {PARAM_INFO[p].unidad && <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>· {PARAM_INFO[p].unidad}</span>}
                      </label>
                      <input className="input mono" type="number" step={PARAM_INFO[p].step}
                        value={m[p]} onChange={e => updateMuestra(tipo.id, p, e.target.value)}
                        placeholder="—" />
                    </div>
                  ))}
                </div>

                <div className="rule-dotted" style={{ margin: "16px 0 12px 0" }} />

                <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
                  <div className="label-eyebrow" style={{ fontSize: 9 }}>Relaciones</div>
                  {RELACIONES.map(r => {
                    if (r === "Brix/K" && tipo.id === "lisimetro") return null;
                    const v = rels[r];
                    const u = REL_UNIT[r];
                    return (
                      <div key={r} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
                          {r}{u && <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.7 }}>· {u}</span>}
                        </span>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: v != null ? "var(--ink)" : "var(--ink-3)" }}>
                          {v != null ? v : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        );
      })}

      {/* ACCIONES */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", marginTop: 22 }}>
        {feedback && (
          <div style={{ fontSize: 13, color: feedback.startsWith("✓") ? "var(--green)" : "var(--warn)", marginRight: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {feedback.startsWith("✓") ? <Check size={14} /> : <AlertCircle size={14} />}
            {feedback}
          </div>
        )}
        <button className="btn btn-ghost" onClick={limpiar} disabled={busy}>
          <RotateCcw size={14} /> Limpiar valores
        </button>
        <button className="btn btn-green" onClick={guardar} disabled={busy}>
          {busy ? <span className="spinner" /> : <Check size={14} />}
          {busy ? "Guardando…" : "Guardar registro"}
        </button>
      </div>
    </div>
  );
}
