// ─────────────────────────────────────────────────────────────────
//  Configuración de módulos Sap & Soil
//  Cada módulo es un HTML independiente en /public/sapsoil/
//  Se renderizan dentro de un iframe vía ModuleViewer.jsx
// ─────────────────────────────────────────────────────────────────

import {
  Mountain,        // suelo
  Sprout,          // plan nutricional
  Apple,           // calidad post-cosecha (frutos)
  Droplets,        // soluciones iónicas / agua
  GraduationCap,   // capacitaciones
  Beaker           // hidroponia
} from "lucide-react";

export const MODULOS = [
  {
    id: "fertilidad-suelo",
    nombre: "Análisis de fertilidad",
    descripcion: "Diagnóstico de suelo · 67 productos minerales · 6 enmiendas con curvas de mineralización",
    categoria: "Diagnóstico",
    cultivo: "Tomate · Suelo",
    icono: Mountain,
    color: "var(--green)",
    archivo: "/sapsoil/fertilidad-suelo.html",
    etapa: "etapa1"
  },
  {
    id: "plan-nutricional-tomate",
    nombre: "Plan nutricional · Tomate",
    descripcion: "Programa de fertirriego por racimo · 5 épocas de plantación · curvas savia/CE objetivo",
    categoria: "Planificación",
    cultivo: "Tomate · Quillota",
    icono: Sprout,
    color: "var(--green)",
    archivo: "/sapsoil/plan-nutricional-tomate.html",
    etapa: "etapa2"
  },
  {
    id: "calidad-postcosecha-tomate",
    nombre: "Calidad post-cosecha",
    descripcion: "Vida útil 12-14 días · 8 defectos · trazabilidad savia → enmiendas → suelo",
    categoria: "Diagnóstico",
    cultivo: "Tomate · Quillota",
    icono: Apple,
    color: "var(--amber)",
    archivo: "/sapsoil/calidad-postcosecha-tomate.html",
    etapa: "etapa3"
  },
  {
    id: "soluciones-ionicas",
    nombre: "Soluciones iónicas",
    descripcion: "Dashboard de cálculo y balance iónico para soluciones nutritivas",
    categoria: "Cálculo",
    cultivo: "Hidroponía · Sustrato",
    icono: Droplets,
    color: "var(--green)",
    archivo: "/sapsoil/soluciones-ionicas.html"
  },
  {
    id: "capacitacion-riego-frutilla",
    nombre: "Capacitación · Riego Frutilla",
    descripcion: "Manejo de riego en cultivo de frutilla en sustrato · La Serena",
    categoria: "Capacitación",
    cultivo: "Frutilla · La Serena",
    icono: GraduationCap,
    color: "var(--ink-2)",
    archivo: "/sapsoil/capacitacion-riego-frutilla.html"
  },
  {
    id: "capacitacion-nutricion-frutilla",
    nombre: "Capacitación · Nutrición Frutilla",
    descripcion: "Manejo nutricional en cultivo de frutilla en sustrato · La Serena",
    categoria: "Capacitación",
    cultivo: "Frutilla · La Serena",
    icono: GraduationCap,
    color: "var(--ink-2)",
    archivo: "/sapsoil/capacitacion-nutricion-frutilla.html"
  },
  {
    id: "hidrosuite",
    nombre: "HidroSuite",
    descripcion: "Suite de cálculo hidropónico y mezclas · solubilidad y compatibilidad",
    categoria: "Cálculo",
    cultivo: "Hidroponía",
    icono: Beaker,
    color: "var(--green)",
    archivo: "/sapsoil/hidrosuite.html"
  }
];

// Agrupar por categoría para la vista hub
export const MODULOS_POR_CATEGORIA = MODULOS.reduce((acc, m) => {
  if (!acc[m.categoria]) acc[m.categoria] = [];
  acc[m.categoria].push(m);
  return acc;
}, {});

// Buscar un módulo por id
export function findModulo(id) {
  return MODULOS.find(m => m.id === id);
}
