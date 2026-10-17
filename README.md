# Calori Sub — versión preparada para análisis de fotos con IA

## Qué incluye
- App web adaptable a móvil, logo blanco/negro y modo instalable como PWA.
- Registro local de comidas, tipo de comida e historial.
- Buscador nutricional con Open Food Facts (necesita internet).
- Botón para análisis visual de comida por IA, conectado a un servidor Node.

## Importante sobre la IA y los costos
El análisis por foto usa la API de OpenAI. Hace falta una clave API y una cuenta con facturación habilitada; el uso de la API no se incluye automáticamente en una suscripción de ChatGPT y no se puede prometer que sea gratis. No pongas la clave API en `app.js` ni en ningún archivo del navegador: debe guardarse como variable de entorno `OPENAI_API_KEY` en el servidor. Nunca compartas esa clave en chats ni en repositorios públicos. Si sos menor, pedile a un adulto de confianza que te ayude a configurar cualquier cuenta o facturación.

## Probar localmente
1. Instalar Node.js en una computadora.
2. En esta carpeta ejecutar `npm install`.
3. Configurar la variable de entorno `OPENAI_API_KEY` en el servidor.
4. Ejecutar `npm start` y abrir `http://localhost:3000`.
5. Para instalarla como PWA en el celular, se necesita publicarla con HTTPS. El service worker no funciona como PWA desde un archivo ZIP o `file://`.

## Límites
- La foto solo permite estimar: no determina con certeza gramos, ingredientes ocultos, aceite, rellenos o receta.
- El historial se guarda localmente en ese navegador/dispositivo; no se sincroniza entre teléfonos.
- Los alimentos del buscador proceden de una base de datos abierta y pueden tener información incompleta.
- Esta app no sustituye orientación médica o nutricional. En menores, no usarla para hacer dietas restrictivas ni perseguir objetivos de peso sin un profesional de salud.
