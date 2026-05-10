import { useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";

export default function ModuleViewer({ modulo, onBack }) {
  const iframeRef = useRef(null);
  const Icono = modulo.icono;

  // Cuando se cambia de módulo, hacer scroll al tope
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [modulo?.id]);

  const abrirNuevaPestana = () => {
    window.open(modulo.archivo, "_blank", "noopener,noreferrer");
  };

  const pantallaCompleta = () => {
    if (iframeRef.current && iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  return (
    <div className="anim-fade-in" style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px 0" }}>
      {/* BREADCRUMB / TOOLBAR */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-ghost"
            onClick={onBack}
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            <ArrowLeft size={13} /> Volver al hub
          </button>
          <span style={{ color: "var(--ink-3)", fontSize: 12 }}>·</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icono size={14} style={{ color: modulo.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {modulo.nombre}
            </span>
            {modulo.cultivo && (
              <span style={{
                fontSize: 9,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginLeft: 4
              }}>
                {modulo.cultivo}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-ghost"
            onClick={pantallaCompleta}
            style={{ padding: "6px 10px", fontSize: 11 }}
            title="Pantalla completa"
          >
            <Maximize2 size={12} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={abrirNuevaPestana}
            style={{ padding: "6px 10px", fontSize: 11 }}
            title="Abrir en pestaña nueva"
          >
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* IFRAME · contenedor del módulo */}
      <div style={{
        background: "var(--paper, #FCFAF4)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        overflow: "hidden",
        height: "calc(100vh - 180px)",
        minHeight: 600
      }}>
        <iframe
          ref={iframeRef}
          src={modulo.archivo}
          title={modulo.nombre}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block"
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
          loading="lazy"
        />
      </div>
    </div>
  );
}
