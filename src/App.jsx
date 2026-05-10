import { useState, useEffect } from "react";
import "./styles.css";

import Login from "./components/Login";
import PasswordReset from "./components/PasswordReset";
import Header from "./components/Header";
import EntryForm from "./components/EntryForm";
import HistoryTable from "./components/HistoryTable";
import ChartsPanel from "./components/ChartsPanel";
import HubSapSoil from "./components/HubSapSoil";
import ModuleViewer from "./components/ModuleViewer";

import { onAuthStateChange, logout } from "./lib/auth";
import { fetchEmpresas, fetchPredios, fetchMyProfile, fetchMyAssignedPredios, fetchRegistros, fetchRangos } from "./lib/db";
import { supabase } from "./lib/supabase";
import { findModulo } from "./lib/modules-config";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [predios, setPredios] = useState([]);
  const [assignedPredioIds, setAssignedPredioIds] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [rangos, setRangos] = useState(null);
  const [tab, setTab] = useState("entry");
  const [loading, setLoading] = useState(true);
  const [resetMode, setResetMode] = useState(false);

  // Detectar si venimos de un link de password reset
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("reset") === "1") {
      setResetMode(true);
    }
  }, []);

  // Subscribe a cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = onAuthStateChange((s) => {
      setSession(s);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // Carga datos cuando hay sesión
  useEffect(() => {
    if (!session || resetMode) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [prof, emps, preds, assigned, regs, rgs] = await Promise.all([
          fetchMyProfile(),
          fetchEmpresas(),
          fetchPredios(),
          fetchMyAssignedPredios(),
          fetchRegistros(),
          fetchRangos()
        ]);
        if (cancelled) return;
        setProfile(prof);
        setEmpresas(emps);
        setPredios(preds);
        setAssignedPredioIds(assigned);
        setRegistros(regs);
        setRangos(rgs);
        if (prof?.rol === "gerente") setTab("charts");
        else setTab("entry");
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [session, resetMode]);

  const refreshRegistros = async () => {
    try {
      const regs = await fetchRegistros();
      setRegistros(regs);
    } catch (err) {
      console.error("Error refrescando registros:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setProfile(null);
  };

  // Handler para abrir un módulo desde el hub
  const openModulo = (modulo) => {
    setTab(`modulo:${modulo.id}`);
  };

  // Handler para volver al hub desde un módulo
  const backToHub = () => {
    setTab("sapsoil");
  };

  if (loading) {
    return (
      <div className="app-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 13, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cargando…</div>
      </div>
    );
  }

  // Reset de contraseña vía link de correo
  if (resetMode) {
    return <PasswordReset onDone={() => setResetMode(false)} />;
  }

  if (!session) {
    return <Login />;
  }

  // Sesión activa pero perfil aún no cargado
  if (!profile) {
    return (
      <div className="app-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 12 }}>
        <div className="spinner" />
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Cargando tu perfil…</div>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={handleLogout}>Cerrar sesión</button>
      </div>
    );
  }

  const empresaNombre = empresas.find(e => e.id === profile.empresa_id)?.nombre;

  // Determinar si estamos viendo un módulo Sap & Soil
  const moduloActivo = (tab || "").startsWith("modulo:")
    ? findModulo(tab.replace("modulo:", ""))
    : null;

  return (
    <div className="app-root">
      <Header profile={profile} onLogout={handleLogout} tab={tab} setTab={setTab} empresaNombre={empresaNombre} />

      {tab === "entry" && profile.rol !== "gerente" && (
        <EntryForm
          profile={profile}
          empresas={empresas}
          predios={predios}
          assignedPredioIds={assignedPredioIds}
          onSaved={refreshRegistros}
        />
      )}

      {tab === "history" && (
        <HistoryTable
          profile={profile}
          registros={registros}
          empresas={empresas}
          onDeleted={refreshRegistros}
        />
      )}

      {tab === "charts" && (
        <ChartsPanel
          profile={profile}
          registros={registros}
          empresas={empresas}
          rangos={rangos}
        />
      )}

      {/* HUB Sap & Soil · solo admin */}
      {tab === "sapsoil" && profile.rol === "admin" && (
        <HubSapSoil
          profile={profile}
          onSelectModulo={openModulo}
        />
      )}

      {/* MÓDULO SELECCIONADO · solo admin */}
      {moduloActivo && profile.rol === "admin" && (
        <ModuleViewer
          modulo={moduloActivo}
          onBack={backToHub}
        />
      )}

      <footer style={{ borderTop: "1px solid var(--rule)", marginTop: 60, padding: "20px", textAlign: "center", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em" }}>
        Rafael Elizondo Pastén · Quillota · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
