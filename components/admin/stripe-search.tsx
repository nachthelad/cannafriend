"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type StripeSearchScope = "all" | "payments" | "subscriptions";

export type StripeSearchFilters = {
  email: string;
  scope: StripeSearchScope;
};

export type StripeSearchItem = {
  type: "payment" | "subscription";
  id: string;
  status?: string;
  customer_email?: string;
  customer_id?: string;
  amount?: number;
  currency?: string;
  date?: string;
};

interface StripeSearchProps {
  filters: StripeSearchFilters;
  items: StripeSearchItem[];
  loading: boolean;
  onFiltersChange: (next: Partial<StripeSearchFilters>) => void;
  onSearch: () => void;
  onReprocess: (item: StripeSearchItem) => void;
  variant?: "desktop" | "mobile";
  className?: string;
}

export function AdminStripeSearch({
  filters,
  items,
  loading,
  onFiltersChange,
  onSearch,
  onReprocess,
  variant = "desktop",
  className,
}: StripeSearchProps) {
  const handleChange = (
    key: keyof StripeSearchFilters,
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
          <label className="text-xs text-muted-foreground">Email del cliente</label>
          <Input
            placeholder="email@ejemplo.com"
            value={filters.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <select
            className="border rounded px-2 py-2 text-sm w-full bg-background"
            value={filters.scope}
            onChange={(event) =>
              handleChange("scope", event.target.value as StripeSearchScope)
            }
          >
            <option value="all">Todos</option>
            <option value="payments">Pagos</option>
            <option value="subscriptions">Suscripciones</option>
          </select>
        </div>
        <div className={cn("flex", variant === "desktop" ? "justify-end" : "")}> 
          <Button
            onClick={onSearch}
            disabled={loading || !filters.email}
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
                    <th className="py-3 px-4 font-medium">Monto</th>
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
                      <td className="py-3 px-4">{item.customer_email || "-"}</td>
                      <td className="py-3 px-4">
                        {item.amount && item.currency
                          ? `${item.amount / 100} ${item.currency.toUpperCase()}`
                          : "-"}
                      </td>
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
                    <span className="font-medium capitalize">{item.type}</span>
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
                  <div>Email: {item.customer_email || "-"}</div>
                  <div>
                    Monto:
                    {item.amount && item.currency
                      ? ` ${item.amount / 100} ${item.currency.toUpperCase()}`
                      : " -"}
                  </div>
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
          No se encontraron resultados en Stripe.
        </p>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Stripe - Buscar pagos</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <section className={cn("rounded-xl border bg-background shadow-sm", className)}>
      <div className="border-b px-6 py-5">
        <h2 className="text-xl font-semibold">Stripe - Búsqueda de pagos</h2>
        <p className="text-sm text-muted-foreground">
          Localiza pagos y suscripciones utilizando el email del cliente.
        </p>
      </div>
      <div className="px-6 py-5">{content}</div>
    </section>
  );
}
