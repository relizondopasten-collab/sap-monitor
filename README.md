# Sap Monitor · App web

Monitoreo nutricional de savia y solución de suelo para tomate de invernadero.
Frontend en React + Vite, backend en Supabase.

## Stack

- React 18 + Vite
- Supabase JS (auth + base de datos)
- Recharts (gráficas)
- Lucide (iconos)

## Probar localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` (basado en `.env.example`):

```bash
cp .env.example .env.local
```

Y edítalo con TUS claves de Supabase:

```
VITE_SUPABASE_URL=https://yitorjwbtvgezykcrery.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...TU-ANON-KEY...
```

> **Importante**: aquí va la **anon key** (la pública), NO la service_role.
> Las anon keys son seguras de exponer al navegador porque las RLS protegen los datos.

### 3. Correr el servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:5173

## Login de prueba

- **Encargados** (los 18): nombre completo (ej. `Patricio Ramirez`) + contraseña `inicio2026`
- **Gerentes** (Felipe Stambuk, Ricardo Stambuk): por nombre o por email + contraseña
- **Admin** (Rafael): tu email `r.elizondo.pasten@gmail.com` + contraseña que te pusiste

Los gerentes y el admin pueden además recuperar contraseña por correo automáticamente.

## Build de producción

```bash
npm run build
npm run preview   # para verificar el build localmente
```

El build sale a `dist/`.

## Deploy en Vercel

### Primera vez

1. Sube el código a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # crea el repo en github.com primero
   git remote add origin https://github.com/TU-USUARIO/sap-monitor.git
   git push -u origin main
   ```

2. Anda a https://vercel.com → **Add New** → **Project**
3. Importa el repo `sap-monitor` desde GitHub
4. Vercel detecta Vite automáticamente. **No cambies** los Build Settings.
5. **Environment Variables** — agrega las dos:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon key
6. Click **Deploy**. En ~1 minuto tendrás tu app en `https://sap-monitor-XYZ.vercel.app`

### Configurar el redirect de Supabase

Para que el reset de contraseña por correo funcione, en Supabase:

1. Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: pega tu URL de Vercel (ej. `https://sap-monitor-XYZ.vercel.app`)
3. **Redirect URLs**: agrega también `https://sap-monitor-XYZ.vercel.app/?reset=1`
4. **Save**

### Updates automáticos

Cada vez que hagas `git push origin main`, Vercel rebuilda y publica automáticamente.

## Estructura del proyecto

```
sap-monitor-app/
├── src/
│   ├── components/
│   │   ├── Login.jsx          ← login híbrido (nombre o email)
│   │   ├── PasswordReset.jsx  ← pantalla post-link de correo
│   │   ├── Header.jsx         ← navegación según rol
│   │   ├── EntryForm.jsx      ← ingreso de mediciones
│   │   ├── HistoryTable.jsx   ← tabla de registros + CSV
│   │   └── ChartsPanel.jsx    ← gráficas semanales con bandas
│   ├── lib/
│   │   ├── supabase.js        ← cliente Supabase + helper de email sintético
│   │   ├── auth.js            ← login, logout, reset password
│   │   ├── db.js              ← todas las queries a la BD
│   │   └── constants.js       ← tipos, parámetros, helpers
│   ├── styles.css             ← estilos globales (estética cuaderno de lab)
│   ├── App.jsx                ← composición + estado global
│   └── main.jsx               ← entrypoint React
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── package.json
├── .env.example
└── .gitignore
```

## Cómo funcionan las cosas

### Login híbrido

- Si lo que escribes contiene `@`, se usa como email directo (gerentes, admin)
- Si no contiene `@`, se asume nombre y se convierte a `<nombre-en-kebab>@interno.sap-monitor.app`
- Ambos casos usan `supabase.auth.signInWithPassword`

### Seguridad

- La anon key es pública (puede ir al navegador)
- Las RLS en Supabase filtran lecturas y escrituras por `auth.uid()` y rol
- Los gerentes están bloqueados a nivel de base de datos para INSERT/UPDATE/DELETE
- Encargados solo ven sus predios asignados (vía tabla `profile_predios`)
- El admin (rol = 'admin') ve todo

### Cálculo de relaciones

Las relaciones K/Ca, NO₃/K, Na/K, Na/Ca y Brix/K se calculan **en la base de datos** mediante GENERATED COLUMNS (ver `01_schema.sql`). El cliente solo las muestra. La fórmula vive en un solo lugar y la otra app (saviolog) las consume gratis.

### Próximos pasos

- Editor de rangos de referencia desde la UI (admin)
- Reportes PDF por predio
- Comparación entre múltiples sectores en una gráfica
- Integración con la otra app (saviolog) cuando agregues módulos suelo/agua/clima
