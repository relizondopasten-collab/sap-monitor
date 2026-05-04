import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error(
    "Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. " +
    "Revisa tu .env.local en desarrollo o las Environment Variables de Vercel en producción."
  );
}

export const supabase = createClient(url || "", anon || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Dominio de emails sintéticos para encargados (login híbrido por nombre)
export const INTERNO_EMAIL_DOMAIN = "interno.sap-monitor.app";

// Convierte "Patricio Ramirez" → "patricio-ramirez@interno.sap-monitor.app"
// Igual al que usa 04_seed_users.mjs en el backend
export function nombreToEmail(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-") + "@" + INTERNO_EMAIL_DOMAIN;
}
