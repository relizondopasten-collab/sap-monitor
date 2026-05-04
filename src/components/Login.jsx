import { useState } from "react";
import { AlertCircle, ChevronRight, Lock, User, Mail, Check } from "lucide-react";
import { login, requestPasswordReset, looksLikeEmail } from "../lib/auth";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      await login(identifier, password);
      // El AuthProvider del root reaccionará al cambio de sesión
    } catch (err) {
      setError(err.message || "Error al ingresar");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async () => {
    setError(""); setBusy(true);
    try {
      await requestPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError(err.message || "No se pudo enviar el correo");
    } finally {
      setBusy(false);
    }
  };

  const isEmail = looksLikeEmail(identifier);

  return (
    <div className="grid-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", minHeight: "100vh" }}>
      <div className="card anim-fade-in" style={{ maxWidth: 460, width: "100%", padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="stamp" style={{ marginBottom: 18 }}>Quillota · Valparaíso</div>
          <div className="display" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.05 }}>
            Monitor de <em style={{ fontStyle: "italic", color: "var(--green)" }}>savia</em><br />
            <span style={{ color: "var(--ink-2)" }}>&amp; lisímetro</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)", letterSpacing: "0.02em" }}>
            Asesorías y Desarrollo Agrícola SpA
          </div>
        </div>

        <div className="rule-h" style={{ margin: "20px 0 24px 0" }} />

        {!resetMode ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="field-label">Nombre o email</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Nombre y apellido · o tu email"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
                {identifier && (
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex", alignItems: "center" }}>
                    {isEmail ? <Mail size={14} /> : <User size={14} />}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <input
                className="input mono"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                onKeyDown={e => e.key === "Enter" && submit()}
              />
            </div>
            {error && (
              <div style={{ color: "var(--warn)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} />{error}
              </div>
            )}
            <button className="btn btn-green" style={{ justifyContent: "center", padding: "11px 18px" }} onClick={submit} disabled={busy}>
              {busy ? <span className="spinner" /> : <Lock size={14} />}
              {busy ? "Ingresando…" : "Ingresar"}
              {!busy && <ChevronRight size={14} />}
            </button>
            <button
              onClick={() => { setResetMode(true); setError(""); setResetEmail(isEmail ? identifier : ""); }}
              style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 6, fontFamily: "Geist, sans-serif" }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5, marginTop: 6, padding: "10px 12px", background: "rgba(94,141,78,0.05)", borderLeft: "2px solid var(--green-2)", borderRadius: 2 }}>
              <strong style={{ color: "var(--green)" }}>Encargados</strong> · ingresan con su nombre completo (nombre y apellido)<br/>
              <strong style={{ color: "var(--amber)" }}>Gerencia y asesor</strong> · ingresan con su email
            </div>
          </div>
        ) : (
          <div className="anim-fade-in" style={{ display: "grid", gap: 14 }}>
            <div className="label-eyebrow">Recuperar contraseña</div>
            {resetSent ? (
              <div style={{ padding: 16, background: "rgba(94,141,78,0.08)", border: "1px solid var(--green-2)", borderRadius: 4, fontSize: 13, color: "var(--green)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontWeight: 600 }}>
                  <Check size={14} /> Correo enviado
                </div>
                Revisa tu bandeja en <span className="mono">{resetEmail}</span>. El enlace expira en 1 hora.
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  Te enviaremos un enlace al email registrado. Solo disponible para gerencia y asesor.
                  Los encargados deben contactar al asesor.
                </div>
                <input
                  className="input"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="tu@email.com"
                  type="email"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && submitReset()}
                />
                {error && (
                  <div style={{ color: "var(--warn)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setResetMode(false); setResetSent(false); setError(""); }}>
                Volver
              </button>
              {!resetSent && (
                <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={submitReset} disabled={busy}>
                  {busy ? <span className="spinner" /> : "Enviar enlace"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
