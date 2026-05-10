"use client";

type SurfaceLoadingProps = {
  message?: string;
};

export function SurfaceLoading({
  message = "Cargando...",
}: SurfaceLoadingProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
