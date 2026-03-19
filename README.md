# FTM - Football Team Manager

Aplicación de gestión de equipos de fútbol construida con Next.js y Electron.

## 📁 Estructura del Proyecto

```
ftm/
├── src/                    # Aplicación Next.js
│   ├── app/               # Páginas de la aplicación (App Router)
│   │   ├── page.tsx       # Dashboard principal
│   │   ├── players/       # Gestión de jugadores
│   │   ├── stats/         # Estadísticas
│   │   ├── reports/       # Reportes
│   │   ├── compare/       # Comparación de jugadores
│   │   └── annual-reports/ # Reportes anuales
│   ├── components/        # Componentes React reutilizables
│   │   └── ui/           # Componentes de UI (shadcn/ui)
│   ├── contexts/         # Context providers (React Context)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilidades y funciones auxiliares
│   │   ├── db.ts         # Funciones de base de datos
│   │   ├── actions.ts    # Server actions
│   │   └── utils.ts      # Utilidades generales
│   ├── public/           # Archivos estáticos
│   ├── styles/           # Estilos globales
│   └── package.json      # Dependencias de Next.js
│
├── electron-app/          # Aplicación Electron
│   ├── main.cjs          # Proceso principal de Electron
│   └── package.json      # Dependencias de Electron
│
├── db/                    # Base de datos (SQLite)
│
└── package.json          # Scripts principales del proyecto
```

## 🚀 Instalación

### 1. Instalar todas las dependencias

```bash
npm run install:all
```

O instalando manualmente:

```bash
# Raíz
npm install

# Next.js
cd src && npm install

# Electron
cd ../electron-app && npm install
```

## 🛠️ Desarrollo

### Iniciar Next.js (Desarrollo Web)

```bash
npm run dev
# o
npm run dev:next
```

La aplicación estará disponible en `http://localhost:3000`

### Iniciar con Electron (Aplicación de Escritorio)

Primero, inicia el servidor de Next.js:

```bash
npm run dev:next
```

Luego, en otra terminal, inicia Electron:

```bash
npm run electron
```

## 📦 Construcción

### Construir la aplicación Next.js

```bash
npm run build:next
```

### Construir todo el proyecto

```bash
npm run build
```

## 🎯 Características

- **Gestión de Jugadores**: CRUD completo de jugadores
- **Estadísticas**: Seguimiento de estadísticas por jugador y por partido
- **Reportes**: Generación de reportes personalizados
- **Comparación**: Comparar rendimiento entre jugadores
- **Reportes Anuales**: Análisis anuales del equipo
- **Interfaz Moderna**: UI construida con Tailwind CSS y shadcn/ui
- **Aplicación de Escritorio**: Empaquetado con Electron para uso offline

## 🔧 Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Gráficos**: Recharts
- **Desktop**: Electron
- **Database**: SQLite (Better-sqlite3)

## 📝 Scripts Disponibles

- `npm run dev` - Inicia Next.js en modo desarrollo
- `npm run dev:next` - Inicia Next.js en modo desarrollo
- `npm run dev:electron` - Inicia Electron en modo desarrollo
- `npm run build` - Construye todo el proyecto
- `npm run build:next` - Construye solo Next.js
- `npm start` - Alias para `npm run dev`
- `npm run electron` - Inicia Electron (requiere Next.js corriendo)

## 🗄️ Base de Datos

La base de datos SQLite se encuentra en la carpeta `db/`. Los esquemas y funciones de acceso están definidos en `src/lib/db.ts`.

## 📄 Licencia

Ver archivo [LICENSE](LICENSE)

## 👤 Autor

Mateo Cornejo - [GitHub](https://github.com/CornejoMateo)
