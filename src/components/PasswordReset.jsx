import { useState } from "react";
import { Check, AlertCircle, KeyRound } from "lucide-react";
import { updatePassword, logout } from "../lib/auth";

export default function PasswordReset({ onDone }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (pwd.length < 6) return setErr("Mínimo 6 caracteres");
    if (pwd !== pwd2) return setErr("Las contraseñas no coinciden");
    setBusy(true);
    try {
      await updatePassword(pwd);
      setDone(true);
      // Limpiar el query param y volver al login
      setTimeout(async () => {
        window.history.replaceState({}, "", window.location.pathname);
        await logout();
        onDone && onDone();
      }, 2000);
    } catch (e) {
      setErr(e.message || "No se pudo cambiar la contraseña");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", minHeight: "100vh" }}>
      <div className="card anim-fade-in" style={{ maxWidth: 460, width: "100%", padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <KeyRound size={28} style={{ color: "var(--green)", marginBottom: 12 }} />
          <div className="display" style={{ fontSize: 26, fontWeight: 600 }}>Nueva contraseña</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>Ingresa una contraseña nueva para tu cuenta</div>
        </div>

        {done ? (
          <div style={{ padding: 16, background: "rgba(94,141,78,0.08)", border: "1px solid var(--green-2)", borderRadius: 4, fontSize: 13, color: "var(--green)", textAlign: "center" }}>
            <Check size={16} style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 600 }}>Contraseña actualizada</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>Te redirigimos al login…</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="field-label">Nueva contraseña</label>
              <input className="input mono" type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••" autoFocus />
            </div>
            <div>
              <label className="field-label">Confirmar</label>
              <input className="input mono" type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="••••••"
                onKeyDown={e => e.key === "Enter" && submit()} />
            </div>
            {err && (
              <div style={{ color: "var(--warn)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} />{err}
              </div>
            )}
            <button className="btn btn-green" style={{ justifyContent: "center" }} onClick={submit} disabled={busy}>
              {busy ? <span className="spinner" /> : <Check size={14} />}
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
