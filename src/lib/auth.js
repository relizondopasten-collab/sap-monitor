import { supabase, nombreToEmail, INTERNO_EMAIL_DOMAIN } from "./supabase";

// ─────────────────────────────────────────────────────────────────
//  AUTH · login híbrido
//  - Si el "identifier" parece email real → login con email
//  - Si no, se asume nombre → se convierte a email sintético interno
// ─────────────────────────────────────────────────────────────────

export function looksLikeEmail(s) {
  return /\S+@\S+\.\S+/.test((s || "").trim());
}

export async function login(identifier, password) {
  const id = (identifier || "").trim();
  if (!id || !password) throw new Error("Ingresa nombre/email y contraseña");

  const email = looksLikeEmail(id) ? id : nombreToEmail(id);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Mensajes en español más claros
    if (error.message?.includes("Invalid login credentials")) {
      throw new Error("Nombre/email o contraseña incorrectos");
    }
    throw error;
  }
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

// Recuperación de contraseña por correo (solo emails reales).
// Se rechaza si el identifier es un email del dominio interno.
export async function requestPasswordReset(email) {
  const e = (email || "").trim();
  if (!looksLikeEmail(e)) throw new Error("Ingresa un email válido");
  if (e.endsWith("@" + INTERNO_EMAIL_DOMAIN)) {
    throw new Error("Las cuentas internas no tienen recuperación. Pide reset al administrador.");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(e, {
    redirectTo: window.location.origin + "/?reset=1"
  });
  if (error) throw error;
}

// Permite que el usuario actualice su propia contraseña (post-recuperación o desde su perfil)
export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session));
}
