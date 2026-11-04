# Frontend — Citrino Intelligence

Panel web en React 19 + TypeScript + Vite. La descripción del proyecto, el modelo de datos y las variables de entorno están en el [README de la raíz](../README.md).

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # tsc -b && vite build (un error de tipos rompe el build)
npm run lint      # oxlint
```

Necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `frontend/.env`.
