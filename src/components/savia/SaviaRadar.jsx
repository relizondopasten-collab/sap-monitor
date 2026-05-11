import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TIPOS_MUESTRA, RELACIONES } from "../../lib/constants";
import { normalizeForRadar } from "../../lib/savia-evaluator";
import { getBanda } from "../../lib/db";

/**
 * Vista de radar para comparación de mediciones.
 * Cada eje del radar es un ratio. Los valores se normalizan 0-100
 * según su distancia al centro de la banda óptima.
 *
 * Props:
 *   - registroActual: el registro completo (con joven/vieja/lisimetro)
 *   - registroAnterior: el registro anterior del mismo predio/sector (para comparar)
 *   - rangos: tabla de rangos de fetchRangos()
 *   - estadoKey: estado fenológico actual
 */
export default function SaviaRadar({ registroActual, registroAnterior, rangos, estadoKey }) {
  // Para cada tejido construimos un dataset y un chart
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {TIPOS_MUESTRA.map((tejido) => {
        const medAct = registroActual?.[tejido.id];
        const medAnt = registroAnterior?.[tejido.id];
        if (!medAct) return null;
        return (
          <RadarTejido
            key={tejido.id}
            tejido={tejido}
            medicionActual={medAct}
            medicionAnterior={medAnt}
            rangos={rangos}
            estadoKey={estadoKey}
          />
        );
      })}
    </div>
  );
}

function RadarTejido({ tejido, medicionActual, medicionAnterior, rangos, estadoKey }) {
  // Construir los datos del radar
  const data = useMemo(() => {
    return RELACIONES
      .filter((rel) => !(rel === "Brix/K" && tejido.id === "lisimetro"))
      .map((rel) => {
        const banda = getBanda(rangos, tejido.id, estadoKey, rel);
        const valActual = medicionActual?.[rel];
        const valAnterior = medicionAnterior?.[rel];
        return {
          ratio: rel,
          actual: normalizeForRadar(valActual, banda),
          anterior: medicionAnterior ? normalizeForRadar(valAnterior, banda) : null,
          actual_raw: valActual,
          anterior_raw: valAnterior,
          banda
        };
      });
  }, [medicionActual, medicionAnterior, tejido.id, estadoKey, rangos]);

  if (data.length === 0) return null;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
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
        <div style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: "auto", letterSpacing: "0.04em" }}>
          {medicionAnterior ? "Comparación con medición anterior" : "Solo medición actual"}
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={data} margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
            <PolarGrid stroke="var(--rule-2)" />
            <PolarAngleAxis
              dataKey="ratio"
              tick={{ fontSize: 11, fill: "var(--ink-2)", fontFamily: "Geist, sans-serif", fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "var(--ink-3)", fontFamily: "Geist Mono" }}
              tickCount={5}
              stroke="var(--rule)"
            />
            <Tooltip content={<RadarTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "Geist" }}
              iconType="circle"
            />

            {/* Capa de la banda óptima al 100% (referencia) */}
            <Radar
              name="Óptimo (100)"
              dataKey={() => 100}
              stroke={tejido.color}
              strokeOpacity={0.25}
              strokeDasharray="3 3"
              fill={tejido.color}
              fillOpacity={0.06}
              isAnimationActive={false}
              legendType="none"
            />

            {/* Medición anterior (si existe) */}
            {medicionAnterior && (
              <Radar
                name="Anterior"
                dataKey="anterior"
                stroke="var(--ink-3)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill="var(--ink-3)"
                fillOpacity={0.06}
              />
            )}

            {/* Medición actual */}
            <Radar
              name="Actual"
              dataKey="actual"
              stroke={tejido.color}
              strokeWidth={2}
              fill={tejido.color}
              fillOpacity={0.22}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          fontSize: 10,
          color: "var(--ink-3)",
          marginTop: 4,
          paddingTop: 8,
          borderTop: "1px dashed var(--rule-2)",
          lineHeight: 1.4
        }}
      >
        El radar normaliza cada ratio según su distancia al centro de la banda óptima del estado fenológico seleccionado.
        Valor 100 = centro de banda · 50 = borde de banda · 0 = muy alejado.
      </div>
    </div>
  );
}

function RadarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "8px 10px",
        fontSize: 12,
        fontFamily: "Geist, sans-serif"
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.ratio}</div>
      <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: "var(--ink-2)" }}>
        Actual: {row.actual_raw != null ? Number(row.actual_raw).toFixed(2) : "—"}
        {row.anterior_raw != null && <> · Anterior: {Number(row.anterior_raw).toFixed(2)}</>}
      </div>
      {row.banda && (
        <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
          Banda óptima: <span className="mono">{row.banda.min}–{row.banda.max}</span>
        </div>
      )}
    </div>
  );
}
