import { Heart, AlertTriangle, AlertCircle, MinusCircle } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "../../lib/savia-evaluator";

/**
 * Tarjeta de salud global. Muestra:
 *  - Score 0-100 con barra de progreso
 *  - Conteo de estados (ok / above / below / no_data)
 *  - Indicador visual del nivel general
 */
export default function SaviaScore({ score, counts, total }) {
  // Determinar el color y mensaje según el score
  let scoreColor, scoreLabel, scoreIcon;
  if (score == null) {
    scoreColor = STATUS_COLORS.no_data;
    scoreLabel = "Sin datos suficientes";
    scoreIcon = MinusCircle;
  } else if (score >= 85) {
    scoreColor = STATUS_COLORS.ok;
    scoreLabel = "Equilibrio nutricional óptimo";
    scoreIcon = Heart;
  } else if (score >= 60) {
    scoreColor = STATUS_COLORS.above;
    scoreLabel = "Equilibrio aceptable, vigilar";
    scoreIcon = AlertTriangle;
  } else {
    scoreColor = "#B5361E";
    scoreLabel = "Desequilibrio nutricional";
    scoreIcon = AlertCircle;
  }

  const Icon = scoreIcon;

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        {/* Lado izquierdo: score grande */}
        <div style={{ flex: "0 0 auto" }}>
          <div className="label-eyebrow">Salud nutricional</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <div
              className="display"
              style={{
                fontSize: 56,
                fontWeight: 600,
                lineHeight: 1,
                color: scoreColor,
                fontVariantNumeric: "tabular-nums"
              }}
            >
              {score != null ? score : "—"}
            </div>
            <div style={{ fontSize: 16, color: "var(--ink-3)", fontWeight: 500 }}>
              / 100
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              fontSize: 13,
              color: scoreColor,
              fontWeight: 500
            }}
          >
            <Icon size={14} />
            {scoreLabel}
          </div>
        </div>

        {/* Lado derecho: distribución de estados */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
          <div className="label-eyebrow" style={{ marginBottom: 10 }}>
            Distribución de ratios evaluados
          </div>

          {/* Barra de distribución */}
          {total > 0 && (
            <div
              style={{
                display: "flex",
                height: 22,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 10,
                background: "var(--rule-2)",
                border: "1px solid var(--rule)"
              }}
            >
              {["ok", "below", "above", "no_data"].map((key) => {
                const count = counts[key] || 0;
                if (count === 0) return null;
                const pct = (count / total) * 100;
                return (
                  <div
                    key={key}
                    style={{
                      width: `${pct}%`,
                      background: STATUS_COLORS[key],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "white",
                      fontFamily: "Geist Mono, monospace"
                    }}
                    title={`${STATUS_LABELS[key]}: ${count}`}
                  >
                    {pct >= 10 && count}
                  </div>
                );
              })}
            </div>
          )}

          {/* Conteo por categoría */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 8
            }}
          >
            {["ok", "above", "below", "no_data"].map((key) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: "var(--paper-2)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: STATUS_COLORS[key],
                    flexShrink: 0
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.3 }}>
                  <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                    {counts[key] || 0}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {STATUS_LABELS[key]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

