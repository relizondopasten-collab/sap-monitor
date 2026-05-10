import { useEffect, useState } from "react";
import { MapPin, Loader2, Check, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { precargarContextoCampo, leerContextoActivo, limpiarContextoCampo } from "../lib/campo-context";

// Componente compacto que aparece arriba del Hub Sap & Soil.
// Permite elegir un predio + sector activos. Cuando el usuario los elige,
// se precarga el contexto del campo a localStorage para que los
// módulos HTML standalone tengan acceso a los últimos análisis.

export default function SelectorPredio({ onContextoCambiado }) {
  const [predios, setPredios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predioId, setPredioId] = useState(null);
  const [predioNombre, setPredioNombre] = useState("");
  const [sector, setSector] = useState("");
  const [precargando, setPrecargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("predios")
          .select("id, nombre, empresa:empresas(nombre)")
          .order("nombre");
        if (error) throw error;
        if (!cancel) setPredios(data || []);

        // Restaurar contexto previo
        const ctx = leerContextoActivo();
        if (ctx && !cancel) {
          setPredioId(ctx.predio_id);
          setPredioNombre(ctx.predio_nombre || "");
          setSector(ctx.sector || "");
        }
      } catch (err) {
        console.warn("[SelectorPredio] No se pudieron cargar predios:", err.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const handleSeleccionar = async (id) => {
    const predio = predios.find(p => p.id === id);
    if (!predio) return;
    setPredioId(id);
    setPredioNombre(predio.nombre);
    setResultado(null);
  };

  const handleAplicar = async () => {
    if (!predioId) return;
    setPrecargando(true);
    setResultado(null);
    try {
      const r = await precargarContextoCampo({
        predioId,
        predioNombre,
        sector: sector || null,
        temporadaId: null
      });
      setResultado(r);
      if (onContextoCambiado) onContextoCambiado(r);
    } finally {
      setPrecargando(false);
    }
  };

  const handleLimpiar = () => {
    limpiarContextoCampo();
    setPredioId(null);
    setPredioNombre("");
    setSector("");
    setResultado(null);
    if (onContextoCambiado) onContextoCambiado({ ok: false, motivo: "limpiado" });
  };

  if (loading) {
    return (
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--rule)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "var(--ink-3)",
        fontSize: 12
      }}>
        <Loader2 size={13} className="anim-spin" />
        Cargando predios...
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(217,165,93,0.06), rgba(255,255,255,0))",
      border: "1px solid rgba(217,165,93,0.3)",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 24
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <MapPin size={13} style={{ color: "var(--amber)" }} />
        <div className="label-eyebrow" style={{ color: "var(--amber)", fontSize: 10 }}>
          Predio activo · contexto del campo
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <label className="field-label" style={{ fontSize: 10, marginBottom: 4, display: "block" }}>
            Predio
          </label>
          <select
            className="select"
            value={predioId || ""}
            onChange={(e) => handleSeleccionar(e.target.value)}
            style={{ width: "100%", fontSize: 13 }}
          >
            <option value="">— Sin predio activo —</option>
            {predios.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.empresa?.nombre ? `· ${p.empresa.nombre}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "0 1 160px", minWidth: 130 }}>
          <label className="field-label" style={{ fontSize: 10, marginBottom: 4, display: "block" }}>
            Sector (opcional)
          </label>
          <input
            type="text"
            className="input"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="ej: Norte, Lote 3..."
            style={{ width: "100%", fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-green"
            onClick={handleAplicar}
            disabled={!predioId || precargando}
            style={{ padding: "7px 14px", fontSize: 12, opacity: !predioId ? 0.5 : 1 }}
          >
            {precargando ? (
              <><Loader2 size={12} className="anim-spin" /> Cargando...</>
            ) : (
              <>Aplicar predio</>
            )}
          </button>
          {predioId && (
            <button
              className="btn btn-ghost"
              onClick={handleLimpiar}
              title="Limpiar contexto"
              style={{ padding: "7px 10px", fontSize: 12 }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Indicador de resultado */}
      {resultado && resultado.ok && (
        <div style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "rgba(94,141,78,0.08)",
          border: "1px solid rgba(94,141,78,0.3)",
          borderRadius: 6,
          fontSize: 11,
          color: "var(--ink-2)",
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>
            <Check size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Contexto cargado · disponible en módulos:
          </div>
          {resultado.agua ? (
            <div>💧 Agua: {fmtFecha(resultado.agua.fecha)}</div>
          ) : (
            <div style={{ color: "var(--ink-3)" }}>💧 Agua: sin análisis</div>
          )}
          {resultado.saviaJoven ? (
            <div>🌱 Savia hoja joven: {fmtFecha(resultado.saviaJoven.fecha)}</div>
          ) : null}
          {resultado.saviaVieja ? (
            <div>🌿 Savia hoja vieja: {fmtFecha(resultado.saviaVieja.fecha)}</div>
          ) : null}
          {resultado.lisimetro ? (
            <div>💧 Lisímetro: {fmtFecha(resultado.lisimetro.fecha)}</div>
          ) : null}
        </div>
      )}

      {resultado && !resultado.ok && resultado.motivo !== "limpiado" && (
        <div style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "rgba(217,124,93,0.08)",
          border: "1px solid rgba(217,124,93,0.3)",
          borderRadius: 6,
          fontSize: 11,
          color: "var(--ink-2)"
        }}>
          ⚠️ {resultado.motivo}
        </div>
      )}
    </div>
  );
}

function fmtFecha(f) {
  if (!f) return "—";
  try {
    return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return f;
  }
}
