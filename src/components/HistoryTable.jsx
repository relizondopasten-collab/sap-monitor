import { useState, useMemo } from "react";
import { Database, Filter, Download, Trash2, X } from "lucide-react";
import { TIPOS_MUESTRA, PARAM_INFO, RELACIONES, fmtFecha } from "../lib/constants";
import { deleteRegistro } from "../lib/db";

export default function HistoryTable({ profile, registros, empresas, onDeleted }) {
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroPredio, setFiltroPredio] = useState("");
  const [filtroSector, setFiltroSector] = useState("");

  const visibles = useMemo(() => {
    let r = registros;
    if (filtroEmpresa) r = r.filter(x => x.empresaId === filtroEmpresa);
    if (filtroPredio)  r = r.filter(x => x.predio === filtroPredio);
    if (filtroSector)  r = r.filter(x => (x.sector || "").toLowerCase().includes(filtroSector.toLowerCase()));
    return r;
  }, [registros, filtroEmpresa, filtroPredio, filtroSector]);

  const empresasUsuario = profile.rol === "admin" ? empresas : empresas.filter(e => e.id === profile.empresa_id);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await deleteRegistro(id);
      onDeleted && onDeleted();
    } catch (err) {
      alert("No se pudo eliminar: " + (err.message || ""));
    }
  };

  const exportCSV = () => {
    const headers = [
      "fecha", "empresa", "predio", "sector", "epoca", "variedad", "estado",
      ...TIPOS_MUESTRA.flatMap(t => Object.keys(PARAM_INFO).filter(p => t.id === "lisimetro" ? PARAM_INFO[p].suelo : PARAM_INFO[p].savia).map(p => `${t.id}_${p}`)),
      ...TIPOS_MUESTRA.flatMap(t => RELACIONES.filter(r => !(r === "Brix/K" && t.id === "lisimetro")).map(r => `${t.id}_${r.replace("/", "_")}`))
    ];
    const rows = visibles.map(r => {
      const row = [r.fecha, r.empresaNombre, r.predio, r.sector, r.epoca, r.variedad, r.estado];
      TIPOS_MUESTRA.forEach(t => {
        const params = Object.keys(PARAM_INFO).filter(p => t.id === "lisimetro" ? PARAM_INFO[p].suelo : PARAM_INFO[p].savia);
        params.forEach(p => row.push(r[t.id]?.[p] ?? ""));
      });
      TIPOS_MUESTRA.forEach(t => {
        RELACIONES.forEach(rel => {
          if (rel === "Brix/K" && t.id === "lisimetro") return;
          row.push(r[t.id]?.[rel] ?? "");
        });
      });
      return row;
    });
    const csv = [headers, ...rows].map(r => r.map(c => {
      const s = String(c ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `registros_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div className="label-eyebrow">Histórico</div>
          <h1 className="display" style={{ fontSize: 30, fontWeight: 600, marginTop: 6, marginBottom: 0 }}>
            Registros <em style={{ fontStyle: "italic", color: "var(--green)" }}>guardados</em>
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
            {visibles.length} registro{visibles.length !== 1 && "s"}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!visibles.length}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* FILTROS */}
      <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Filter size={14} style={{ color: "var(--ink-3)", marginBottom: 12 }} />
        {profile.rol === "admin" && (
          <div style={{ minWidth: 200 }}>
            <label className="field-label">Empresa</label>
            <select className="select" value={filtroEmpresa} onChange={e => { setFiltroEmpresa(e.target.value); setFiltroPredio(""); }}>
              <option value="">Todas</option>
              {empresasUsuario.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}
        <div style={{ minWidth: 180 }}>
          <label className="field-label">Predio</label>
          <select className="select" value={filtroPredio} onChange={e => setFiltroPredio(e.target.value)}>
            <option value="">Todos</option>
            {[...new Set(visibles.map(v => v.predio))].sort().map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <label className="field-label">Sector (búsqueda)</label>
          <input className="input" value={filtroSector} onChange={e => setFiltroSector(e.target.value)} placeholder="Ej. MOD 7" />
        </div>
        {(filtroEmpresa || filtroPredio || filtroSector) && (
          <button className="btn btn-ghost" onClick={() => { setFiltroEmpresa(""); setFiltroPredio(""); setFiltroSector(""); }}>
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visibles.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
            <Database size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>No hay registros que coincidan</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {profile.rol === "admin" && <th>Empresa</th>}
                  <th>Predio · Sector</th>
                  <th>Variedad / Estado</th>
                  <th>Hoja joven</th>
                  <th>Hoja vieja</th>
                  <th>Lisímetro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(r => (
                  <RegistroRow key={r.id} r={r} showEmpresa={profile.rol === "admin"} canDelete={profile.rol !== "gerente"} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RegistroRow({ r, showEmpresa, canDelete, onDelete }) {
  const cell = (m) => {
    if (!m) return <span style={{ color: "var(--ink-3)", fontSize: 11 }}>—</span>;
    return (
      <div style={{ fontSize: 12, lineHeight: 1.5 }} className="mono">
        {m.NO3  != null && <div>NO₃ <span style={{ color: "var(--ink-3)" }}>{m.NO3}</span></div>}
        {m.K    != null && <div>K <span style={{ color: "var(--ink-3)" }}>{m.K}</span></div>}
        {m.Ca   != null && <div>Ca <span style={{ color: "var(--ink-3)" }}>{m.Ca}</span></div>}
        {m.Na   != null && <div>Na <span style={{ color: "var(--ink-3)" }}>{m.Na}</span></div>}
        {m.CE   != null && <div>CE <span style={{ color: "var(--ink-3)" }}>{m.CE}</span></div>}
        {m.pH   != null && <div>pH <span style={{ color: "var(--ink-3)" }}>{m.pH}</span></div>}
        {m.Brix != null && <div>°Bx <span style={{ color: "var(--ink-3)" }}>{m.Brix}</span></div>}
        {(m["K/Ca"] != null || m["Na/K"] != null) && (
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px dashed var(--rule)", fontSize: 10, color: "var(--green)" }}>
            {m["K/Ca"] != null && <>K/Ca {Number(m["K/Ca"]).toFixed(2)}</>}
            {m["K/Ca"] != null && m["Na/K"] != null && " · "}
            {m["Na/K"] != null && <>Na/K {Number(m["Na/K"]).toFixed(2)}</>}
          </div>
        )}
      </div>
    );
  };

  return (
    <tr>
      <td className="mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{fmtFecha(r.fecha)}</td>
      {showEmpresa && <td style={{ fontSize: 13 }}>{r.empresaNombre}</td>}
      <td style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 500 }}>{r.predio}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.sector}</div>
      </td>
      <td style={{ fontSize: 12 }}>
        <div>{r.variedad} <span style={{ color: "var(--ink-3)" }}>· {r.epoca}</span></div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{r.estado}</div>
      </td>
      <td>{cell(r.joven)}</td>
      <td>{cell(r.vieja)}</td>
      <td>{cell(r.lisimetro)}</td>
      <td>
        {canDelete && (
          <button className="btn-danger btn" onClick={() => onDelete(r.id)} title="Eliminar">
            <Trash2 size={11} />
          </button>
        )}
      </td>
    </tr>
  );
}
