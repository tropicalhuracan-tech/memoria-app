# Publicar Memoria en Vercel (celular + dominio propio)

## 1. Subir el proyecto

1. Crea un repo en GitHub con la carpeta `memoria-app` (o el monorepo completo).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. **Root Directory:** `memoria-app` si el repo incluye más carpetas.
4. Framework: Next.js (detectado automáticamente).

## 2. Base de datos (backup cifrado)

1. En el proyecto Vercel → **Storage** → **Create Database** → **Neon Postgres**.
2. Conecta la base al proyecto; Vercel inyecta `POSTGRES_URL`.
3. Las tablas se crean solas la primera vez que alguien registra una cuenta.

## 3. Variables de entorno

En **Settings → Environment Variables**:

| Variable | Valor |
|----------|--------|
| `AUTH_SECRET` | Cadena aleatoria larga (`openssl rand -base64 32`) |
| `POSTGRES_URL` | (automática si enlazaste Neon) |

Redeploy después de añadir variables.

## 4. Dominio propio

1. **Settings → Domains** → añade `memoria.tudominio.com`.
2. En tu DNS (Cloudflare, etc.), crea el registro que indique Vercel (CNAME o A).
3. Espera propagación (minutos u horas). Vercel emite HTTPS automático.

## 5. Usar solo en el celular

1. Abre tu dominio en **Chrome (Android)** o **Safari (iPhone)**.
2. Toca **Añadir a pantalla de inicio** (banner en la app o menú del navegador).
3. En **Cuenta** crea usuario → la copia se sube cifrada.
4. En otro celular: mismo dominio, **Entrar** con el mismo correo y contraseña.

## 6. Límites útiles

- La copia incluye fotos/audio en base64; Neon free tier tiene límite de tamaño — conviene no guardar videos enormes.
- La contraseña de cuenta **cifra** el backup; si la pierdes, no se puede recuperar la copia (diseño zero-knowledge).

## Comprobar en local con nube

```bash
cp .env.example .env.local
# Rellena AUTH_SECRET y POSTGRES_URL
npm run dev
```
