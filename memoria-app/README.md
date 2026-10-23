# Memoria

App **móvil-first** (PWA) para guardar llaves, claves, fotos, reuniones y notas de voz, y preguntar por chat o voz.

## Funciones

- Objetos, fotos, reuniones, notas de voz, claves (bóveda local)
- Chat con dictado en español
- **Backup en la nube cifrado** (cuenta + Postgres en Vercel/Neon)
- Instalable en pantalla de inicio del celular

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # opcional: AUTH_SECRET + POSTGRES_URL
npm run dev
```

## Publicar en Vercel y dominio propio

Guía paso a paso: **[DEPLOY.md](./DEPLOY.md)**

## Producción

```bash
npm run build
npm start
```
