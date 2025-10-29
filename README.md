# Dental-Practice

Local development has been set up with Vite + React.

Quick start
- Prereqs: Node.js 18+ and npm
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Open: http://localhost:5173

Available scripts
- `npm run dev` – start Vite dev server
- `npm run build` – production build into `dist/`
- `npm run preview` – serve the build locally

Notes
- Path alias `@` points to the project root, so imports like `@/utils` and `@/components/ui/button` resolve correctly.
- A lightweight mock API is provided at `api/base44Client.js` to serve dentists, services, and accept appointment creations in localStorage.
- UI primitives (`Button`, `Card`, `Select`, etc.) live under `components/ui/` and are minimal shadcn-like components for local use.
- Pages are in `Pages/` and use JSX; do not rename back to `.js`.
