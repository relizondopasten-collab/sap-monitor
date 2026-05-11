import { TIPOS_MUESTRA } from "../../lib/constants";
import { STATUS_COLORS, STATUS_LABELS } from "../../lib/savia-evaluator";

/**
 * Vista de gauges semicirculares para todos los ratios del registro seleccionado.
 * Muestra un gauge por cada (tejido × ratio).
 *
 * Props:
 *   - evaluaciones: { joven: {K/Ca: {status, value, banda}, ...}, vieja: {...}, lisimetro: {...} }
 *   - mediciones: el objeto del registro (con joven, vieja, lisimetro)
 */
export default function SaviaGauges({ evaluaciones, mediciones }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {TIPOS_MUESTRA.map((tejido) => {
        const evals = evaluaciones[tejido.id];
        const medicion = mediciones[tejido.id];
        if (!evals || !medicion) return null;
        const ratios = Object.entries(evals);
        if (ratios.length === 0) return null;

        return (
          <div key={tejido.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: tejido.color
                }}
              />
              <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>
                {tejido.labelLargo}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14
              }}
            >
              {ratios.map(([nombre, ev]) => (
                <Gauge key={nombre} nombre={nombre} ev={ev} tejidoColor={tejido.color} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Un gauge individual: semicírculo con banda óptima y aguja.
 *
 * Layout SVG (viewBox 200x130):
 *   - Arco principal 0-180° (gris)
 *   - Banda óptima superpuesta (verde semi-transparente)
 *   - Aguja en posición del valor
 *   - Texto con valor y estado debajo
 */
function Gauge({ nombre, ev }) {
  const { status, value, banda, unit } = ev;
  const color = STATUS_COLORS[status];

  // Determinar dominio visual del gauge (un poco más amplio que la banda)
  let domainMin, domainMax;
  if (banda && banda.min != null && banda.max != null) {
    const span = banda.max - banda.min;
    domainMin = Math.max(0, banda.min - span * 0.6);
    domainMax = banda.max + span * 0.6;
    // Si el valor está fuera, ampliamos para que se vea la aguja
    if (value != null) {
      if (value < domainMin) domainMin = Math.max(0, value - span * 0.2);
      if (value > domainMax) domainMax = value + span * 0.2;
    }
  } else if (value != null) {
    domainMin = Math.max(0, value * 0.5);
    domainMax = value * 1.5;
  } else {
    domainMin = 0;
    domainMax = 1;
  }

  // Mapear un valor del dominio a ángulo (-180° izquierda = min, 0° derecha = max)
  // Usamos el rango 180°-360° para que sea semicírculo superior
  const valToAngle = (v) => {
    if (v == null) return null;
    const pct = (v - domainMin) / (domainMax - domainMin);
    const clamped = Math.max(0, Math.min(1, pct));
    return 180 + clamped * 180; // 180° (izq) → 360° (der)
  };

  // Convierte ángulo polar a coordenadas cartesianas en el SVG (centro en 100,100)
  const polarToCartesian = (angleDeg, radius) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(rad),
      y: 100 + radius * Math.sin(rad)
    };
  };

  // Genera el path del arco entre dos ángulos
  const arcPath = (startAngle, endAngle, radius) => {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const bandStart = banda ? valToAngle(banda.min) : null;
  const bandEnd = banda ? valToAngle(banda.max) : null;
  const valueAngle = valToAngle(value);

  // Aguja
  let needleEnd = null;
  if (valueAngle != null) {
    needleEnd = polarToCartesian(valueAngle, 70);
  }

  // Formato del valor
  const fmtVal = (v) => {
    if (v == null) return "—";
    return v < 10 ? v.toFixed(2) : v.toFixed(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-2)",
          marginBottom: 2,
          letterSpacing: "0.02em"
        }}
      >
        {nombre}
        {unit && (
          <span style={{ fontSize: 9, color: "var(--ink-3)", fontWeight: 400, marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </div>

      <svg width="100%" viewBox="0 0 200 130" style={{ maxWidth: 200 }}>
        {/* Arco base (gris) */}
        <path
          d={arcPath(180, 360, 80)}
          fill="none"
          stroke="var(--rule-2)"
          strokeWidth={12}
          strokeLinecap="round"
        />

        {/* Banda óptima (verde) */}
        {banda && bandStart != null && bandEnd != null && (
          <path
            d={arcPath(bandStart, bandEnd, 80)}
            fill="none"
            stroke={STATUS_COLORS.ok}
            strokeOpacity={0.35}
            strokeWidth={12}
            strokeLinecap="butt"
          />
        )}

        {/* Aguja */}
        {needleEnd && (
          <>
            <line
              x1={100}
              y1={100}
              x2={needleEnd.x}
              y2={needleEnd.y}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle cx={100} cy={100} r={5} fill={color} />
          </>
        )}

        {/* Ticks de límites de la banda */}
        {banda && (
          <>
            <text
              x={polarToCartesian(bandStart, 95).x}
              y={polarToCartesian(bandStart, 95).y + 3}
              textAnchor="middle"
              fontSize={8}
              fontFamily="Geist Mono, monospace"
              fill="var(--ink-3)"
            >
              {banda.min}
            </text>
            <text
              x={polarToCartesian(bandEnd, 95).x}
              y={polarToCartesian(bandEnd, 95).y + 3}
              textAnchor="middle"
              fontSize={8}
              fontFamily="Geist Mono, monospace"
              fill="var(--ink-3)"
            >
              {banda.max}
            </text>
          </>
        )}

        {/* Valor centrado */}
        <text
          x={100}
          y={125}
          textAnchor="middle"
          fontSize={18}
          fontFamily="Geist Mono, monospace"
          fontWeight={600}
          fill={color}
        >
          {fmtVal(value)}
        </text>
      </svg>

      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: color,
          marginTop: 2
        }}
      >
        {STATUS_LABELS[status]}
      </div>
    </div>
  );
}
