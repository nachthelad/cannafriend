## CannaFriend

PWA para llevar un diario de cultivo y consumo de marihuana, simple y útil en móvil y desktop. Podés registrar tus plantas, fotos, tareas, recordatorios y sesiones; y ahora también analizar tu planta con IA.

### Lo más importante

- **Análisis con IA de la planta**: Subí una foto y hacé preguntas (o usá un análisis general). La IA sugiere posibles deficiencias, infecciones y cuidados. Podés ver el resultado, guardarlo y volver a consultarlo.
- **Diario de cultivo (Journal)**: Registrá riegos, fertilizaciones, entrenamientos, notas y más, con filtros por fecha y planta.
- **Recordatorios**: Evitá olvidos con avisos para riego, fertilización u otras tareas.
- **Fotos y galería**: Cargá fotos para seguir la evolución de tus plantas.
- **PWA y móvil primero**: Instalá la app y usala cómodo en el teléfono.
- **Multi‑idioma**: Español e inglés.

### Novedades destacadas

- **Nueva página “Análisis con IA”**
  - Ruta: `/analyze-plant`.
  - Subí o sacá una foto, preguntá algo específico o pedí un análisis general.
  - Mostramos la respuesta en un formato agradable y la guardamos en tu Journal de análisis.
  - Cada análisis tiene su propia página: `/analysis/[id]`.
- **Journal de análisis**
  - Lista simple con fecha/hora, pregunta y botón “Ver”.
  - Los análisis se guardan en tu cuenta y aparecen al iniciar sesión.
- **Acceso premium (provisorio)**
  - El análisis con IA está disponible para usuarios autorizados por email (o con un flag local para pruebas). Más adelante se integrará un plan premium.
- **Acceso rápido**
  - En dashboard (móvil) hay un botón “Análisis con IA” con fondo degradado.
  - En desktop aparece en el menú lateral (solo premium), también con estilo destacado.

### Cómo se usa (visión general)

- **Dashboard**: Vista general del cultivo, accesos a recordatorios, búsqueda y plantas.
- **Journal**: Historial de actividades (riego, fertilización, etc.).
- **Fotos**: Documentá el progreso con imágenes.
- **Análisis con IA**:
  1. Entrá a “Análisis con IA”.
  2. Subí o sacá una foto de tu planta.
  3. (Opcional) Escribí una pregunta específica.
  4. Tocá “Analizar con IA”.
  5. Leé las recomendaciones y guardalas (se agregan al Journal de análisis).
  6. Volvé a abrir cualquier análisis por su URL.

### Qué guarda CannaFriend

- **Tus análisis con IA**: fecha y hora, imagen, pregunta y respuesta.
- **Tus registros de cultivo**: riegos, fertilizaciones, entrenamientos, etc.
- **Tus fotos**: subidas por vos, enlazadas a tus plantas.

### Privacidad y control

- Tus datos están asociados a tu cuenta. Podés iniciar sesión y ver tu información desde cualquier dispositivo.
- Al usar la función de IA, la imagen y la consulta se envían al servicio de IA para obtener la respuesta.

### Preguntas frecuentes

- **¿Necesito internet?** La app está pensada como PWA y guarda datos para uso básico offline, pero funciones como subir fotos o usar IA requieren conexión.
- **¿Puedo ver mis análisis antiguos?** Sí, desde “Análisis con IA” (Journal) o directamente en `/analysis/[id]`.
- **¿Puedo usar la cámara del teléfono?** Sí, al subir imagen podés elegir cámara o galería.

### Contacto y ayuda

Si algo no funciona como esperabas o tenés ideas para mejorar, escribinos. Queremos que CannaFriend sea una herramienta realmente útil para tu cultivo.
