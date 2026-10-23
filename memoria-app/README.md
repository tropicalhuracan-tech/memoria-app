# Memoria

Aplicación web personal para quienes olvidamos dónde dejamos las llaves, las claves WiFi o la próxima reunión.

## Funciones

- **Objetos y lugares** — texto + etiqueta de ubicación + GPS opcional
- **Fotos** — captura dónde dejaste algo de valor
- **Claves** — bóveda cifrada en el dispositivo (AES-GCM + frase maestra)
- **Reuniones** — fecha/hora y recordatorio en la vista de inicio
- **Notas de voz** — grabación en el navegador + transcripción manual
- **Chat** — pregunta en texto o por voz (Web Speech API) y busca en tus recuerdos

Los datos viven en **IndexedDB** (Dexie); no se envían a un servidor por defecto.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Producción

```bash
npm run build
npm start
```

## Próximos pasos posibles

- Sincronización cifrada ( cuenta + backup )
- Notificaciones push para reuniones
- Transcripción automática de voz (Whisper / Web Speech)
- LLM opcional vía `OPENAI_API_KEY` para respuestas más conversacionales
