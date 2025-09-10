export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Estás sin conexión</h1>
        <p className="text-muted-foreground mb-4">
          Algunas funciones no están disponibles sin internet. Intenta nuevamente cuando vuelvas a estar en línea.
        </p>
        <p className="text-sm text-muted-foreground">La app seguirá funcionando con el contenido en caché.</p>
      </div>
    </div>
  );
}

