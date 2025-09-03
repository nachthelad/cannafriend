# Configuración de Firebase Storage para Cannafriend

## Pasos para configurar Firebase Storage

### 1. Habilitar Firebase Storage

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto `cannafriend-7899f`
3. En el menú lateral, haz clic en "Storage"
4. Si no está habilitado, haz clic en "Comenzar"
5. Selecciona "Comenzar en modo de prueba" (puedes cambiar las reglas después)

### 2. Subir las reglas de Storage

1. En la consola de Firebase, ve a Storage > Reglas
2. Reemplaza el contenido con las reglas del archivo `storage.rules`:

\`\`\`javascript
rules_version = '2';

service firebase.storage {
match /b/{bucket}/o {
// Reglas para imágenes de usuarios
match /images/{userId}/{allPaths=\*\*} {
// Solo usuarios autenticados pueden acceder a sus propias imágenes
allow read, write: if request.auth != null && request.auth.uid == userId;

      // Validaciones adicionales para subida de archivos
      allow create: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB por archivo
        && request.resource.contentType.matches('image/.*') // Solo imágenes
        && request.resource.contentType.matches('image/(jpeg|jpg|png|webp|gif)'); // Formatos específicos
    }

    // Reglas para otros archivos (si los hay en el futuro)
    match /{allPaths=**} {
      allow read, write: if false; // Denegar acceso por defecto
    }

}
}
\`\`\`

3. Haz clic en "Publicar"

### 3. Configuración de CORS (Opcional)

Si tienes problemas con CORS, puedes configurar las reglas de CORS en la consola de Firebase:

1. Ve a Storage > Configuración
2. En la pestaña "CORS", agrega las siguientes reglas:

\`\`\`json
[
{
"origin": ["*"],
"method": ["GET", "POST", "PUT", "DELETE"],
"maxAgeSeconds": 3600
}
]
\`\`\`

## Características implementadas

### ✅ Funcionalidades completadas:

1. **Componente de subida de imágenes** (`ImageUpload`)

   - Drag & drop de archivos
   - Selección múltiple de archivos
   - Validación de tipos de archivo (JPG, JPEG, PNG, WebP, GIF)
   - Límite de tamaño por archivo (5MB)
   - Límite de cantidad de imágenes (10 máximo por planta)
   - Feedback visual durante la subida

2. **Galería de fotos integrada** (`PhotoGallery`)

   - Campo de imágenes agregado al apartado de Fotos de cada planta
   - Las imágenes se guardan en el documento de la planta en Firestore
   - Vista previa de imágenes con opción de eliminar
   - Modal de galería para ver las imágenes en tamaño completo
   - Navegación con flechas y miniaturas en el modal
   - Soporte para teclado (flechas y ESC)

3. **Visualización de imágenes**

   - Las imágenes se muestran en miniatura en la galería de fotos
   - Modal de galería con navegación completa
   - Soporte para teclado (flechas y ESC)
   - Miniaturas para navegación rápida
   - Botón de eliminar en cada imagen

4. **Reglas de seguridad de Firebase Storage**
   - Solo usuarios autenticados pueden subir imágenes
   - Cada usuario solo puede acceder a sus propias imágenes
   - Validación de tipos de archivo en el servidor
   - Límite de tamaño en el servidor (5MB)

### 📁 Estructura de archivos:

\`\`\`
images/
└── {userId}/
├── {timestamp}\_image1.jpg
├── {timestamp}\_image2.png
└── ...
\`\`\`

### 🔒 Seguridad:

- Las imágenes se almacenan en carpetas separadas por usuario
- Validación tanto en el cliente como en el servidor
- Solo formatos de imagen seguros permitidos
- Límites de tamaño y cantidad configurados

### 🎨 UX/UI:

- Interfaz intuitiva con drag & drop
- Feedback visual durante la subida
- Modal de galería elegante
- Diseño responsive
- Navegación completa con teclado

## Uso

1. **Subir imágenes**: En el apartado de Fotos de una planta, usa el área de drag & drop o haz clic para seleccionar archivos
2. **Ver imágenes**: En la galería de fotos, haz clic en cualquier miniatura para abrir la galería
3. **Navegar**: En la galería, usa las flechas, miniaturas o teclado para navegar
4. **Eliminar**: Pasa el mouse sobre una imagen y haz clic en el botón X para eliminarla

## Organización

### 📸 Apartado de Fotos:

- **Ubicación**: Pestaña "Fotos" en la página de cada planta
- **Funcionalidad**: Subida, visualización y gestión de fotos
- **Límites**: Hasta 10 fotos por planta, 5MB por imagen
- **Formatos**: JPG, JPEG, PNG, WebP, GIF

### 📝 Journal (Sin imágenes):

- **Ubicación**: Pestaña "Journal" en la página de cada planta
- **Funcionalidad**: Registro de actividades (riego, fertilización, entrenamiento, etc.)
- **Nota**: Las imágenes se han movido al apartado de Fotos para mejor organización

## Notas importantes

- Las imágenes se suben automáticamente cuando se seleccionan
- Solo se pueden subir hasta 10 imágenes por planta
- El tamaño máximo por imagen es 5MB
- Los formatos soportados son: JPG, JPEG, PNG, WebP, GIF
- Las imágenes se almacenan de forma segura en Firebase Storage
- Las URLs de las imágenes se guardan en el documento de la planta en Firestore
