"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type UnifiedSearchScope = "all" | "payments" | "preapproval";

export type UnifiedSearchFilters = {
  uid: string;
  status: string;
  scope: UnifiedSearchScope;
};

export type UnifiedSearchItem = {
  type: "payment" | "preapproval";
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
  date?: string | null;
};

interface UnifiedSearchProps {
  filters: UnifiedSearchFilters;
  items: UnifiedSearchItem[];
  loading: boolean;
  onFiltersChange: (next: Partial<UnifiedSearchFilters>) => void;
  onSearch: () => void;
  onReprocess: (item: UnifiedSearchItem) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function AdminUnifiedSearch({
  filters,
  items,
  loading,
  onFiltersChange,
  onSearch,
  onReprocess,
  variant = "desktop",
  className,
}: UnifiedSearchProps) {
  const handleChange = (
    key: keyof UnifiedSearchFilters,
    value: string
  ) => {
    onFiltersChange({ [key]: value });
  };

  const content = (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-3",
          variant === "desktop"
            ? "grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-end"
            : "grid-cols-1"
        )}
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">
            UID (external_reference)
          </label>
          <Input
            placeholder="uid"
            value={filters.uid}
            onChange={(event) => handleChange("uid", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Estado</label>
          <select
            className="border rounded px-2 py-2 text-sm w-full bg-background"
            value={filters.status}
            onChange={(event) => handleChange("status", event.target.value)}
          >
            <option value="">Cualquiera</option>
            <option value="authorized">authorized</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <select
            className="border rounded px-2 py-2 text-sm w-full bg-background"
            value={filters.scope}
            onChange={(event) =>
              handleChange("scope", event.target.value as UnifiedSearchScope)
            }
          >
            <option value="all">Todos</option>
            <option value="payments">Pagos</option>
            <option value="preapproval">Preaprobaciones</option>
          </select>
        </div>
        <div className={cn("flex", variant === "desktop" ? "justify-end" : "")}> 
          <Button
            onClick={onSearch}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        variant === "desktop" ? (
          <div className="rounded-lg border">
            <div className="max-h-[28rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="py-3 px-4 font-medium">Tipo</th>
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">UID</th>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="py-3 px-4 capitalize">{item.type}</td>
                      <td className="py-3 px-4 font-mono text-xs">{item.id}</td>
                      <td className="py-3 px-4">{item.status || "-"}</td>
                      <td className="py-3 px-4">{item.payer_email || "-"}</td>
                      <td className="py-3 px-4">{item.external_reference || "-"}</td>
                      <td className="py-3 px-4">
                        {item.date ? new Date(item.date).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onReprocess(item)}
                          disabled={loading}
                        >
                          Reprocesar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      {item.type}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReprocess(item)}
                      disabled={loading}
                    >
                      Reprocesar
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    ID: {item.id}
                  </div>
                  <div>Estado: {item.status || "-"}</div>
                  <div>Email: {item.payer_email || "-"}</div>
                  <div>UID: {item.external_reference || "-"}</div>
                  <div>
                    Fecha: {item.date ? new Date(item.date).toLocaleString() : "-"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          No se encontraron resultados.
        </p>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>MercadoPago - Buscar suscripción</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <section className={cn("rounded-xl border bg-background shadow-sm", className)}>
      <div className="border-b px-6 py-5">
        <h2 className="text-xl font-semibold">MercadoPago - Búsqueda unificada</h2>
        <p className="text-sm text-muted-foreground">
          Buscar suscripciones y pagos por UID (external_reference).
        </p>
      </div>
      <div className="px-6 py-5">{content}</div>
    </section>
  );
}
