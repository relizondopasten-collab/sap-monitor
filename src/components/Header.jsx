import { FlaskConical, Plus, Database, BarChart3, Building2, LogOut, Layers } from "lucide-react";

export default function Header({ profile, onLogout, tab, setTab, empresaNombre }) {
  // El tab "sapsoil" es activo si tab === "sapsoil" o si empieza con "modulo:"
  const sapsoilActive = tab === "sapsoil" || (tab || "").startsWith("modulo:");

  return (
    <header style={{ borderBottom: "1px solid var(--rule)", background: "rgba(245,241,230,0.95)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <FlaskConical size={20} style={{ color: "var(--green)" }} />
          <div>
            <div className="display" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1 }}>Sap & Soil</div>
            <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>Monitoreo nutricional</div>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center" }}>
          {profile.rol !== "gerente" && (
            <button className={`tab-btn ${tab === "entry" ? "active" : ""}`} onClick={() => setTab("entry")}>
              <Plus size={14} /> Ingresar
            </button>
          )}
          <button className={`tab-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <Database size={14} /> Registros
          </button>
          <button className={`tab-btn ${tab === "charts" ? "active" : ""}`} onClick={() => setTab("charts")}>
            <BarChart3 size={14} /> Gráficas
          </button>
          {/* NUEVO · Sap & Soil suite */}
          <button
            className={`tab-btn tab-btn-amber ${sapsoilActive ? "active" : ""}`}
            onClick={() => setTab("sapsoil")}
            title="Suite agronómica Sap & Soil"
          >
            <Layers size={14} /> Suite
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              {profile.nombre}
              {profile.rol === "gerente" && (
                <span style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", border: "1px solid var(--amber)", padding: "1px 5px", borderRadius: 2, fontWeight: 700 }}>
                  Gerencia
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: profile.rol === "admin" ? "var(--amber)" : "var(--green)" }}>
              {profile.rol === "admin" ? "Asesor · Admin" : (empresaNombre || "—")}
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: "7px 10px" }} onClick={onLogout} title="Cerrar sesión">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
