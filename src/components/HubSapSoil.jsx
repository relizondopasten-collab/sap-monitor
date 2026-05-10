import { useMemo, useState } from "react";
import { Layers, ChevronRight } from "lucide-react";
import { MODULOS_POR_CATEGORIA } from "../lib/modules-config";
import SelectorPredio from "./SelectorPredio";

export default function HubSapSoil({ profile, onSelectModulo }) {
  const categorias = useMemo(() => Object.keys(MODULOS_POR_CATEGORIA), []);
  const [contextoActivo, setContextoActivo] = useState(null);

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      {/* HEADER DE LA SECCIÓN */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Layers size={14} style={{ color: "var(--amber)" }} />
          <div className="label-eyebrow" style={{ color: "var(--amber)" }}>
            Suite agronómica
          </div>
        </div>
        <h1 className="display" style={{ fontSize: 32, fontWeight: 600, marginTop: 0, marginBottom: 8 }}>
          Módulos <em style={{ fontStyle: "italic", color: "var(--amber)" }}>Sap & Soil</em>
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 14, marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>
          Herramientas complementarias al monitoreo de savia y lisímetro: análisis de fertilidad,
          planes nutricionales, calidad post-cosecha y capacitaciones técnicas.
        </p>
      </div>

      {/* SELECTOR DE PREDIO ACTIVO · contexto del campo */}
      <SelectorPredio onContextoCambiado={setContextoActivo} />

      {/* GRID DE MÓDULOS POR CATEGORÍA */}
      {categorias.map(categoria => (
        <section key={categoria} style={{ marginBottom: 40 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14
          }}>
            <div className="label-eyebrow" style={{ fontSize: 11 }}>
              {categoria}
            </div>
            <div style={{
              flex: 1,
              height: 1,
              background: "var(--rule)",
              opacity: 0.6
            }} />
          </div>

          <div className="modulos-grid">
            {MODULOS_POR_CATEGORIA[categoria].map(modulo => (
              <ModuloCard
                key={modulo.id}
                modulo={modulo}
                onClick={() => onSelectModulo(modulo)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* FOOTER INFORMATIVO */}
      <div style={{
        marginTop: 48,
        padding: 20,
        background: "rgba(217,165,93,0.06)",
        border: "1px solid rgba(217,165,93,0.18)",
        borderRadius: 4,
        fontSize: 12,
        color: "var(--ink-2)",
        lineHeight: 1.6
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--amber)",
          marginBottom: 8,
          fontWeight: 600
        }}>
          Información
        </div>
        Los módulos abren herramientas independientes con sus propios formularios y
        cálculos. Si seleccionaste un predio activo arriba, los módulos compatibles
        precargan automáticamente el último análisis de agua y los últimos registros
        de savia y lisímetro de ese predio.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ModuloCard · tarjeta individual de un módulo
// ─────────────────────────────────────────────────────────────────
function ModuloCard({ modulo, onClick }) {
  const Icono = modulo.icono;
  return (
    <button
      onClick={onClick}
      className="modulo-card"
      style={{
        background: "var(--paper, #FCFAF4)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        padding: 20,
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.18s ease",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 180,
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Acento de color en la esquina superior */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 3,
        height: 56,
        background: modulo.color,
        opacity: 0.85
      }} />

      {/* Icono y categoría */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 4,
          background: `${modulo.color === 'var(--amber)' ? 'rgba(217,165,93,0.12)' : 'rgba(94,141,78,0.10)'}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: modulo.color,
          flexShrink: 0
        }}>
          <Icono size={18} />
        </div>
        {modulo.cultivo && (
          <span style={{
            fontSize: 9,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            fontWeight: 500,
            paddingTop: 4
          }}>
            {modulo.cultivo}
          </span>
        )}
      </div>

      {/* Título */}
      <div>
        <div style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          marginBottom: 6,
          lineHeight: 1.25
        }}>
          {modulo.nombre}
        </div>
        <div style={{
          fontSize: 12,
          color: "var(--ink-2)",
          lineHeight: 1.5
        }}>
          {modulo.descripcion}
        </div>
      </div>

      {/* Acción */}
      <div style={{
        marginTop: "auto",
        paddingTop: 8,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: modulo.color,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase"
      }}>
        Abrir módulo
        <ChevronRight size={12} />
      </div>
    </button>
  );
}
