# Configuración de reCAPTCHA

## Estado Actual

**reCAPTCHA está actualmente DESHABILITADO** por defecto. Esto permite que la aplicación funcione sin dominio configurado.

## Cómo habilitar reCAPTCHA

Para habilitar reCAPTCHA, agrega esta variable de entorno:

```env
NEXT_PUBLIC_ENABLE_RECAPTCHA=true
```

## Configuración para Desarrollo

En desarrollo, la aplicación usa las claves de prueba de Google reCAPTCHA que están configuradas automáticamente.

## Configuración para Producción

Para configurar reCAPTCHA en producción, sigue estos pasos:

### 1. Crear un proyecto en Google reCAPTCHA

1. Ve a [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Haz clic en "+" para crear un nuevo sitio
3. Selecciona "reCAPTCHA v2" y "I'm not a robot" Checkbox
4. Agrega tu dominio (ej: `cannafriend.com`)
5. Acepta los términos y haz clic en "Submit"

### 2. Obtener las claves

Después de crear el sitio, obtendrás:

- **Site Key**: Clave pública que se usa en el frontend
- **Secret Key**: Clave privada que se usa en el backend (para validación)

### 3. Configurar las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_ENABLE_RECAPTCHA=true
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
```

### 4. Validación en el backend (Opcional)

Para una validación completa, también deberías validar el token en el backend:

```typescript
// Ejemplo de validación en el backend
const validateRecaptcha = async (token: string) => {
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    }
  );

  const data = await response.json();
  return data.success;
};
```

## Variables de Entorno Disponibles

| Variable                         | Descripción                    | Valor por defecto |
| -------------------------------- | ------------------------------ | ----------------- |
| `NEXT_PUBLIC_ENABLE_RECAPTCHA`   | Habilita/deshabilita reCAPTCHA | `false`           |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Clave pública de reCAPTCHA     | Clave de prueba   |

## Notas importantes

- **Actualmente deshabilitado**: reCAPTCHA está deshabilitado por defecto
- **Para habilitar**: Agrega `NEXT_PUBLIC_ENABLE_RECAPTCHA=true` en las variables de entorno
- **En desarrollo**: Se usan las claves de prueba automáticamente
- **En producción**: Asegúrate de configurar ambas variables de entorno
- **Validación condicional**: Solo se valida reCAPTCHA cuando está habilitado
- **UI condicional**: El componente reCAPTCHA solo se muestra cuando está habilitado

## Características implementadas

✅ Confirmación de contraseña (dos campos)  
✅ Validación en tiempo real de contraseñas  
✅ Iconos para mostrar/ocultar contraseñas  
✅ reCAPTCHA v2 Checkbox (condicional)  
✅ Manejo de errores de reCAPTCHA  
✅ Traducciones completas  
✅ Configuración para desarrollo y producción  
✅ Activación/desactivación fácil  
✅ Validación condicional antes del envío del formulario
