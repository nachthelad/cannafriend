"use client";

import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BellRing,
  Calendar,
  Clock3,
  Crown,
  Leaf,
  MessageSquare,
  Package,
  Sprout,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { authorizedFetch } from "@/lib/admin/utils";
import { ROUTE_ADMIN } from "@/lib/routes";
import { clearSuspenseCache, getSuspenseResource } from "@/lib/suspense-utils";
import type { AdminUserDetail } from "@/types/admin";
import { toast } from "sonner";

type AdminUserDetailContainerProps = {
  uid: string;
};

async function fetchAdminUserDetail(uid: string): Promise<AdminUserDetail> {
  const response = await authorizedFetch(
    `/api/admin/users/${encodeURIComponent(uid)}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "request_failed");
  }
  return data.user as AdminUserDetail;
}

function AdminUserDetailSkeleton() {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Cargando usuario...
    </div>
  );
}

function formatDate(value?: string | number | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDays(days: number[]): string {
  if (!days.length) return "Sin días configurados";
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return days
    .map((day) => labels[day] || null)
    .filter((day): day is string => Boolean(day))
    .join(", ");
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function CountCard({
  title,
  total,
  icon,
}: {
  title: string;
  total: number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{total}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

function AdminUserDetailContent({ uid }: AdminUserDetailContainerProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [isDeleting, setIsDeleting] = useState(false);
  const detail = getSuspenseResource(
    `admin-user-detail-${uid}`,
    () => fetchAdminUserDetail(uid)
  ).read();

  async function handleDeleteUser() {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await authorizedFetch(
        `/api/admin/users/${encodeURIComponent(uid)}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "delete_failed");
      }

      clearSuspenseCache("admin-users");
      clearSuspenseCache(`admin-user-detail-${uid}`);
      toast.success("Usuario eliminado");
      router.replace(ROUTE_ADMIN);
      router.refresh();
    } catch (error) {
      handleError(error);
      toast.error("No se pudo eliminar el usuario");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-background shadow-sm">
        <div className="flex flex-col gap-4 border-b px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" asChild className="w-fit">
              <Link href={ROUTE_ADMIN}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a admin
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">
                  {detail.displayName || "Sin nombre"}
                </h2>
                {detail.premium && (
                  <Badge variant="secondary">
                    <Crown className="mr-1 h-3.5 w-3.5" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Ficha informativa del usuario {detail.uid}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Borrar usuario
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto replica el borrado actual de settings: archiva el perfil,
                  plantas, logs y recordatorios antes de eliminar la cuenta.
                  Esta acción no se puede deshacer desde el panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Borrando..." : "Sí, borrar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryField
            label="Nombre"
            value={detail.displayName || "Sin nombre"}
          />
          <SummaryField label="UID" value={detail.uid} />
          <SummaryField label="Email" value={detail.email || "Sin email"} />
          <SummaryField
            label="Premium"
            value={detail.premium ? "Activo" : "No"}
          />
          <SummaryField
            label="Registrado"
            value={formatDate(detail.createdAt)}
          />
          <SummaryField
            label="Timezone"
            value={detail.timezone || "No definida"}
          />
          <SummaryField
            label="Onboarding"
            value={
              detail.onboardingCompletedAt
                ? formatDate(detail.onboardingCompletedAt)
                : "No completado"
            }
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CountCard title="Plantas" total={detail.plants.total} icon={<Sprout className="h-5 w-5" />} />
        <CountCard title="Recordatorios" total={detail.reminders.total} icon={<BellRing className="h-5 w-5" />} />
        <CountCard title="Sesiones" total={detail.sessions.total} icon={<Clock3 className="h-5 w-5" />} />
        <CountCard title="Stash" total={detail.stash.total} icon={<Package className="h-5 w-5" />} />
        <CountCard title="Chats AI" total={detail.aiChats.total} icon={<MessageSquare className="h-5 w-5" />} />
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Plantas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detail.plants.items.length > 0 ? (
              <div className="space-y-3">
                {detail.plants.items.map((plant) => (
                  <div
                    key={plant.id}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{plant.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {plant.id}
                        </p>
                      </div>
                      {plant.status ? (
                        <Badge variant="outline">{plant.status}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Plantada: {formatDateOnly(plant.plantingDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>Creada: {formatDate(plant.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este usuario no tiene plantas registradas.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Recordatorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detail.reminders.items.length > 0 ? (
              <div className="space-y-3">
                {detail.reminders.items.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{reminder.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {reminder.id}
                        </p>
                      </div>
                      <Badge
                        variant={reminder.isActive ? "default" : "secondary"}
                      >
                        {reminder.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Planta: {reminder.plantName || "General"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>
                          Hora: {reminder.timeOfDay || "—"} · {formatDays(reminder.daysOfWeek)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Actualizado: {formatDate(reminder.updatedAt || reminder.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este usuario no tiene recordatorios registrados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminUserDetailContainer(props: AdminUserDetailContainerProps) {
  return (
    <DataErrorBoundary>
      <Suspense fallback={<AdminUserDetailSkeleton />}>
        <AdminUserDetailContent {...props} />
      </Suspense>
    </DataErrorBoundary>
  );
}
