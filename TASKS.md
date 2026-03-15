# Cannafriend — Task Backlog

Generado con auditorías de SEO (seo-audit skill) y UI/accesibilidad (web-design-guidelines de Vercel Labs).
Última actualización: 2026-03-14

---

## Prioridad ALTA

### SEO

- [x] **[SEO] Fix viewport `maximumScale: 1`**
  - Archivo: `app/layout.tsx` (viewport export)
  - Problema: Deshabilita el zoom del usuario. Google lo marca como fallo de usabilidad móvil y viola WCAG.
  - Fix: Eliminar `maximumScale: 1` del export `viewport`.

- [x] **[SEO] Fix robots.txt — permite rutas de la app**
  - Archivo: `app/robots.ts`
  - Problema: `disallow` bloquea `/plants/`, `/journal/` y `/dashboard/`, evitando que Google crawlee las páginas principales de la app. Si alguna vez se hacen públicas, no podrían indexarse.
  - Fix: Mantener solo rutas realmente privadas en `disallow` (`/admin/`, `/api/`, `/settings/`, `/reminders/`, `/ai-assistant/`).

- [x] **[SEO] Agregar tags hreflang para es/en**
  - Archivo: `app/layout.tsx`
  - Problema: La app soporta español e inglés pero no tiene `<link rel="alternate" hrefLang="...">`. Google puede servir el idioma incorrecto a los usuarios.
  - Fix:
    ```html
    <link rel="alternate" hrefLang="es" href="https://cannafriend.app/" />
    <link rel="alternate" hrefLang="en" href="https://cannafriend.app/" />
    <link rel="alternate" hrefLang="x-default" href="https://cannafriend.app/" />
    ```

- [x] **[SEO] Agregar Schema.org structured data**
  - Archivo: `app/layout.tsx`
  - Problema: Cero markup de Schema.org. Sin datos estructurados no hay rich snippets en Google.
  - Fix: Agregar JSON-LD de tipo `SoftwareApplication` en el `<head>` del layout.

- [x] **[SEO] Metadata de páginas protegidas — agregar `robots: { index: false }`**
  - Archivos: `app/plants/page.tsx`, `app/dashboard/page.tsx`, `app/journal/page.tsx`, `app/settings/page.tsx` y demás páginas autenticadas.
  - Problema: Todas heredan el mismo título/descripción del root layout → entradas duplicadas en SERPs.
  - Fix: Exportar `metadata` en cada página con título único + `robots: { index: false }` para las autenticadas.

---

### Accesibilidad

- [x] **[A11Y] Icon-only buttons sin `aria-label`**
  - Archivos:
    - `components/dashboard/dashboard-container.tsx:305` — botón X para cerrar alerta
    - `app/journal/new/page.tsx:239` — botón X para limpiar búsqueda
    - `components/mobile/mobile-journal.tsx:239` — botón X para limpiar búsqueda
  - Fix: Agregar `aria-label` descriptivo en cada botón (ej: `aria-label="Cerrar"`, `aria-label="Limpiar búsqueda"`).

- [x] **[A11Y] Alt text incorrecto en imágenes de plantas**
  - Archivo: `components/plant/plant-card.tsx:48`, `:56`
  - Problema: `alt=""` en imágenes de contenido (no decorativas). Las fotos de plantas son contenido informativo.
  - Fix: Usar `alt={`${plant.name} - foto de planta`}`.

- [x] **[A11Y] `aria-label` en botones de toggle de contraseña**
  - Archivos:
    - `components/auth/login-form.tsx:146` — aria-label hardcodeado en español en lugar de usar `t()`
    - `components/auth/signup-form.tsx:230` y `:270` — botones sin `aria-label`
  - Fix: Agregar `aria-label={t("showPassword", { ns: "auth" })}` usando el sistema de i18n.

---

## Prioridad MEDIA

### Accesibilidad — Iconos decorativos

- [x] **[A11Y] Agregar `aria-hidden="true"` a ~40 iconos decorativos**
  - Los lectores de pantalla anuncian los iconos de Lucide React sin nombre, creando ruido.
  - Archivos y líneas:
    - `components/marketing/hero-section.tsx:64,76,88` — Leaf, Camera, Brain icons
    - `components/marketing/app-showcase.tsx:24,29,34,39,44,49,54,59,65,116` — todos los iconos de features
    - `components/marketing/cta-section.tsx:57,67,77,88` — Leaf, Shield, Zap, Smartphone icons
    - `components/marketing/landing-footer.tsx:19` — ThemeLogo icon
    - `components/plant/plant-card.tsx:64,168,173,184,195` — Leaf, Calendar, Droplet, Zap, Scissors icons
    - `components/dashboard/dashboard-container.tsx:281,392,398,404,410,417` — AlertTriangle, Brain, Bell, Plus, Package, Shield icons
    - `components/mobile/mobile-journal.tsx:227,253,272,280,282,325,335,345,355,383` — múltiples iconos
  - Fix: Agregar `aria-hidden="true"` a todos estos iconos. Tarea mecánica pero importante.

- [x] **[A11Y] Fix semántica HTML en filtros del journal mobile**
  - Archivo: `components/mobile/mobile-journal.tsx:415`
  - Problema: Usa `<label>` como heading de sección en lugar de `<h3>`.
  - Fix: Reemplazar `<label>` de sección por `<h3>` con el estilo correspondiente.

- [x] **[A11Y] SVG de Google en login button sin `aria-hidden`**
  - Archivo: `components/auth/google-login-button.tsx:79`
  - Problema: SVG inline del logo de Google no tiene `aria-hidden="true"`. El botón ya tiene texto "Google" visible.
  - Fix: Agregar `aria-hidden="true"` al SVG.

### SEO — Metadata y Social

- [x] **[SEO] Mejorar título root — demasiado genérico**
  - Archivo: `app/layout.tsx`
  - Problema: Título actual `"cannafriend"` tiene solo 10 caracteres. Ideal: 50-60 chars con keyword principal.
  - Fix: `"Cannafriend - Seguimiento de Plantas y Diario de Cultivo"`

- [x] **[SEO] Twitter Card — cambiar a `summary_large_image`**
  - Archivo: `app/layout.tsx`
  - Problema: Usa `card: "summary"` (imagen pequeña). `summary_large_image` tiene mucho más visibility en Twitter/X.
  - Fix: Cambiar a `summary_large_image` y proveer imagen de 1200x675.

- [x] **[SEO] Agregar `preconnect` a dominios críticos**
  - Archivo: `app/layout.tsx`
  - Problema: Sin preconnect a Firebase, el browser hace un DNS lookup cold en cada sesión.
  - Fix:
    ```html
    <link rel="preconnect" href="https://firestore.googleapis.com" />
    <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
    <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    ```

- [x] **[SEO] Estandarizar theme-color entre layout y manifest**
  - Archivos: `app/layout.tsx` (usa `#121212`) vs `public/manifest.json` (usa `#10b981`)
  - Fix: Elegir un color y usarlo en ambos archivos. Recomendación: el verde `#10b981` del manifest.

- [x] **[SEO] Mejorar sitemap — hacer dinámico**
  - Archivo: `app/sitemap.ts`
  - Problema: Solo 6 rutas hardcodeadas. No usa `process.env.NEXT_PUBLIC_BASE_URL`.
  - Fix: Agregar `baseUrl` desde env var y considerar variantes de idioma.

- [x] **[SEO] Agregar tags canonical por página**
  - Archivos: todas las páginas públicas
  - Problema: Sin canonicals, las variantes de URL (trailing slash, ?utm=, etc.) crean contenido duplicado.
  - Fix: Agregar `alternates: { canonical: "https://cannafriend.app/..." }` en el metadata de cada página.

- [x] **[SEO] Imágenes OG con tamaños correctos para cada plataforma**
  - Archivo: `app/layout.tsx`
  - Problema: Solo existe una imagen 512x512. Facebook/LinkedIn esperan 1200x630, Twitter 1200x675.
  - Fix: Crear las imágenes y referenciarlas separadamente en `openGraph.images` y `twitter.images`.

- [x] **[SEO] Fix login redirect — `/login` no debe redirigir a `/?auth=1`**
  - Archivo: `app/login/page.tsx`
  - Problema: Crea contenido duplicado y una URL fea en el historial del browser.
  - Fix: Hacer `/login` una página standalone en lugar de redirect con query param.

- [x] **[SEO] `lastModified: new Date()` en sitemap — fechas poco confiables**
  - Archivo: `app/sitemap.ts`
  - Problema: Cada build marca todas las URLs como modificadas hoy. Google pierde confianza en el `changeFrequency`.
  - Fix: Usar fechas estáticas reales o calcularlas desde contenido real.

- [x] **[SEO] `description_es` en manifest.json — campo no estándar**
  - Archivo: `public/manifest.json`
  - Problema: El spec de PWA solo soporta un campo `description`. El campo `description_es` es ignorado por los browsers.
  - Fix: Usar solo `description` en inglés (más universal). El soporte multiidioma va en el metadata de Next.js.

### PWA

- [ ] **[PWA] Agregar screenshots al manifest**
  - Archivo: `public/manifest.json`
  - Problema: Sin screenshots, el prompt de instalación de PWA es menos atractivo en navegadores modernos.
  - Fix: Crear screenshots (1280x720 landscape, 540x720 portrait) y agregarlos al manifest.

- [x] **[PWA] Agregar shortcuts al manifest**
  - Archivo: `public/manifest.json`
  - Fix:
    ```json
    "shortcuts": [
      { "name": "Agregar planta", "url": "/plants/new", "icons": [...] },
      { "name": "Ver diario", "url": "/journal", "icons": [...] }
    ]
    ```

---

## Prioridad BAJA

### Accesibilidad / UX

- [x] **[A11Y] Verificar `prefers-reduced-motion` en animaciones**
  - Buscar todos los usos de `transition`, `animate-*`, `framer-motion` en el proyecto.
  - Fix: Agregar variantes `motion-reduce:` de Tailwind o media queries `@media (prefers-reduced-motion: reduce)`.

- [x] **[A11Y] Agregar skip link al contenido principal**
  - Archivo: `app/layout.tsx`
  - Problema: Sin skip link, los usuarios de teclado deben tabear por todo el header en cada página.
  - Fix: Agregar `<a href="#main-content" className="sr-only focus:not-sr-only">Saltar al contenido</a>` al inicio del body.

- [x] **[UX] Estado vacío en listas — verificar cobertura**
  - Revisar todas las listas (plantas, journal, stash) para confirmar que muestran un estado vacío útil en lugar de UI rota.

- [x] **[UX] Acciones destructivas — confirmar antes de ejecutar**
  - Verificar que eliminar plantas, entradas de diario, etc. requiera confirmación o tenga undo.
  - Buscar `onClick` con `delete` o `remove` sin modal de confirmación.

### SEO — Rendimiento

- [x] **[PERF] Imagen hero con `priority` prop**
  - Verificar que la imagen principal del hero (LCP candidate) use `priority={true}` en `<Image>`.

- [x] **[PERF] Agregar `font-display: swap` — verificar consistencia**
  - Confirmar que todos los Google Fonts y fuentes externas usen `display: "swap"`.

- [ ] **[PERF] Listas grandes — evaluar virtualización**
  - Si las listas de plantas o entradas de journal pueden superar 50 items, considerar `virtua` o `content-visibility: auto`.

### Tipografía y Copy

- [x] **[COPY] Reemplazar `...` por `…` en textos de carga**
  - Buscar strings tipo `"Cargando..."`, `"Guardando..."` y reemplazar por `"Cargando…"`.
  - Aplica también a placeholders de inputs.

- [ ] **[COPY] Verificar Title Case en headings y botones**
  - Revisar los textos de botones de acción principales (especialmente en inglés) para asegurar Title Case según Chicago style.

---

## Notas para implementación

- Los tasks de `aria-hidden` en iconos son mecánicos y se pueden hacer en batch con un script o búsqueda/reemplazo.
- El task de `maximumScale` y robots.txt son cambios de 2-5 minutos con alto impacto.
- El Schema.org structured data tiene template listo — solo hay que adaptarlo y agregarlo al layout.
- Para los aria-labels en auth forms, primero verificar si las translation keys existen en `lib/locales/*/auth.json`.
