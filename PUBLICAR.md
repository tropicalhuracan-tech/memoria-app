# Publicar Memoria — paso a paso (hazlo en orden)

Tiempo estimado: **20–40 minutos** la primera vez.

---

## Paso 1 — Código en GitHub

1. Entra a [github.com/new](https://github.com/new).
2. Nombre del repo, por ejemplo: `memoria-app`.
3. **Private** o Public, como prefieras.
4. **No** marques “Add README” (ya tienes código).
5. Clic en **Create repository**.

En tu computadora (donde tengas el proyecto), o pide a Cursor que empuje el repo:

```bash
cd /ruta/a/tu/proyecto
git remote add origin https://github.com/TU_USUARIO/memoria-app.git
git branch -M main
git push -u origin cursor/memoria-app-6595:main
```

> Si todo el repo vive solo en la carpeta `memoria-app`, sube esa carpeta o usa monorepo con **Root Directory** en Vercel (paso 2).

---

## Paso 2 — Proyecto en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) (inicia sesión con GitHub si te lo pide).
2. **Import** el repo `memoria-app`.
3. En **Configure Project**:
   - **Framework Preset:** Next.js
   - **Root Directory:** `memoria-app` (si el repo tiene la app dentro de esa carpeta; si el repo *es* solo la app, déjalo en `./`)
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
4. **Aún no despliegues** — primero variables y base de datos (pasos 3 y 4).

---

## Paso 3 — Base de datos Neon (backup en la nube)

1. En el dashboard de Vercel, abre tu proyecto.
2. Pestaña **Storage** → **Create Database** → elige **Neon** (Postgres).
3. Nombre, región cercana a ti → **Create** → **Connect to Project** (marca Production, Preview, Development).
4. Vercel añade automáticamente `POSTGRES_URL` (o `DATABASE_URL`).

---

## Paso 4 — Secreto de sesión (`AUTH_SECRET`)

1. En el proyecto Vercel: **Settings** → **Environment Variables**.
2. Añade:

| Name | Value | Environments |
|------|--------|--------------|
| `AUTH_SECRET` | *(pega la clave que te dio el agente o genera una nueva con `openssl rand -base64 32`)* | Production, Preview, Development |

3. Guarda.

---

## Paso 5 — Primer deploy

1. **Deployments** → si no hay deploy, **Deploy** desde la rama `main`.
2. Espera estado **Ready** (1–3 min).
3. Abre la URL `https://tu-proyecto.vercel.app` **desde el celular**.

---

## Paso 6 — Probar en el celular

1. En Chrome/Safari: menú → **Añadir a pantalla de inicio** (o el banner dentro de la app).
2. Abre la app → pestaña **Cuenta** → **Crear cuenta** (correo + contraseña ≥ 8 caracteres).
3. Guarda un recuerdo de prueba → en Cuenta debería decir que la copia se subió (con sync automático).
4. Opcional: otro dispositivo → **Entrar** con el mismo correo.

---

## Paso 7 — Dominio propio

1. Vercel → **Settings** → **Domains** → **Add**.
2. Escribe tu dominio, ej. `memoria.midominio.com`.
3. Vercel te muestra un registro DNS (CNAME o A). En tu proveedor (GoDaddy, Cloudflare, etc.):
   - Tipo **CNAME**, nombre `memoria`, valor `cname.vercel-dns.com` (usa el valor exacto que muestre Vercel).
4. Espera propagación (5 min – 48 h). Vercel activará **HTTPS** solo.

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| “Nube no configurada” en Cuenta | Falta `AUTH_SECRET` o `POSTGRES_URL` → revisa env vars y redeploy |
| No instala como app | Usa HTTPS (dominio Vercel o propio), no modo incógnito |
| Backup no sube | Inicia sesión + en la misma sesión escribe contraseña en **Activar sync** |
| Build falla | Root Directory debe apuntar a donde está `package.json` |

---

## Checklist final

- [ ] Repo en GitHub
- [ ] Proyecto Vercel importado
- [ ] Neon conectado
- [ ] `AUTH_SECRET` configurado
- [ ] Deploy Ready
- [ ] Cuenta creada desde el celular
- [ ] (Opcional) Dominio propio

Cuando termines el paso 5, ya es **real**: URL pública + backup cifrado.
