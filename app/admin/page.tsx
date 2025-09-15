"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_LOGIN, resolveHomePathForRoles } from "@/lib/routes";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUserRoles } from "@/hooks/use-user-roles";
import { auth } from "@/lib/firebase";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileAdmin } from "@/components/mobile/mobile-admin";
import { ADMIN_EMAIL } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

type ListedUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  premium: boolean;
  createdAt?: number;
};

export default function AdminPage() {
  const { user, isLoading } = useAuthUser();
  const { roles } = useUserRoles();
  const router = useRouter();
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
  const { toast } = useToast();
  const isAdmin = useMemo(
    () => (user?.email || "").toLowerCase() === ADMIN_EMAIL,
    [user?.email]
  );

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace(ROUTE_LOGIN);
        return;
      }
      if (!isAdmin) {
        router.replace(resolveHomePathForRoles(roles));
        return;
      }
    }
  }, [isLoading, isAdmin, user, router]);

  const fetchUsers = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "request_failed");
      setUsers(data.users as ListedUser[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void fetchUsers();
    }
  }, [isAdmin]);

  const togglePremium = async (u: ListedUser, next: boolean) => {
    if (!auth.currentUser) return;
    const prev = users;
    setUsers((list) =>
      list.map((it) => (it.uid === u.uid ? { ...it, premium: next } : it))
    );
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: u.uid, premium: next }),
      });
      if (!res.ok) {
        throw new Error((await res.json())?.error || "update_failed");
      }
    } catch (e) {
      console.error(e);
      setUsers(prev);
    }
  };

  // MercadoPago unified search (payments + preapprovals)
  type UnifiedItem = {
    type: "payment" | "preapproval";
    id: string;
    status?: string;
    payer_email?: string;
    external_reference?: string;
    date?: string | null;
  };
  const [qUid, setQUid] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qScope, setQScope] = useState<"all" | "payments" | "preapproval">("all");
  const [uniLoading, setUniLoading] = useState(false);
  const [uniItems, setUniItems] = useState<UnifiedItem[]>([]);

  const searchUnified = async () => {
    if (!auth.currentUser) return;
    setUniLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams();
      // Email filter disabled; search by UID only for reliability
      if (qUid) params.set("external_reference", qUid);
      if (qStatus) params.set("status", qStatus);
      if (qScope && qScope !== "all") params.set("scope", qScope);
      const res = await fetch(`/api/mercadopago/admin/unified-search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "search_failed");
      setUniItems((data?.items || []) as UnifiedItem[]);
      if ((data?.items || []).length === 0) {
        toast({ title: "Sin resultados", description: "No se encontraron resultados" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || String(e) });
    } finally {
      setUniLoading(false);
    }
  };

  const reprocessUnified = async (it: UnifiedItem) => {
    setUniLoading(true);
    try {
      const res = await fetch(`/api/mercadopago/webhook?type=${encodeURIComponent(it.type)}&id=${encodeURIComponent(it.id)}`);
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "reprocess_failed");
      toast({ title: "Reprocesado", description: `premium: ${data?.premium ? "true" : "false"}` });
      await fetchUsers();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || String(e) });
    } finally {
      setUniLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "UID") => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: `${label} copiado al portapapeles` });
  };

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      {/* Mobile Layout - only show on mobile */}
      <div className="md:hidden px-4">
        <MobileAdmin
          users={users}
          loading={loading}
          sortDir={sortDir}
          setSortDir={setSortDir}
          fetchUsers={fetchUsers}
          togglePremium={togglePremium}
          copyToClipboard={copyToClipboard}
        />

        {/* MP Search (Mobile) */}
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>MercadoPago - Buscar suscripción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="UID (external_reference)"
                  value={qUid}
                  onChange={(e) => setQUid(e.target.value)}
                />
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-background"
                  value={qStatus}
                  onChange={(e) => setQStatus(e.target.value)}
                >
                  <option value="">Estado (cualquiera)</option>
                  <option value="authorized">authorized</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <Button onClick={searchUnified} disabled={uniLoading} className="w-full">
                  {uniLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {uniItems.length > 0 && (
                <div className="space-y-2">
                  {uniItems.map((it) => (
                    <div key={it.id} className="border rounded p-2">
                      <div className="text-xs text-muted-foreground">ID: {it.id}</div>
                      <div className="text-sm">Estado: {it.status || "-"}</div>
                      <div className="text-xs">Email: {it.payer_email || "-"}</div>
                      <div className="text-xs">UID: {it.external_reference || "-"}</div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => reprocessUnified(it)} disabled={uniLoading}>
                          Reprocesar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Layout - only show on desktop */}
      <div className="hidden md:block w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Admin - Users</h1>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Only visible to {ADMIN_EMAIL}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Sort:</label>
              <select
                className="border rounded px-2 py-1 text-sm bg-background"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={fetchUsers}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-background border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-muted/50">
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">UID</th>
                  <th className="py-3 px-4 font-medium">Registered</th>
                  <th className="py-3 px-4 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[...users]
                  .sort((a, b) => {
                    const ca = a.createdAt || 0;
                    const cb = b.createdAt || 0;
                    return sortDir === "newest" ? cb - ca : ca - cb;
                  })
                  .map((u) => (
                    <tr key={u.uid} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4">{u.email || "—"}</td>
                      <td className="py-3 px-4">{u.displayName || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs select-all">{u.uid}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 py-0 h-7"
                            onClick={() => copyToClipboard(u.uid)}
                            title="Copy UID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Switch
                          checked={u.premium}
                          onCheckedChange={(val) => togglePremium(u, val)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MercadoPago - Búsqueda unificada */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">MercadoPago - Búsqueda unificada</h2>
            <div className="flex flex-wrap items-end gap-2 mb-4">
              {/* Email filter intentionally removed; use UID */}
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs text-muted-foreground">UID (external_reference)</label>
                <Input
                  placeholder="uid"
                  value={qUid}
                  onChange={(e) => setQUid(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-background"
                  value={qStatus}
                  onChange={(e) => setQStatus(e.target.value)}
                >
                  <option value="">(cualquiera)</option>
                  <option value="approved">approved</option>
                  <option value="authorized">authorized</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fuente</label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-background"
                  value={qScope}
                  onChange={(e) => setQScope(e.target.value as any)}
                >
                  <option value="all">Todos</option>
                  <option value="payments">Pagos</option>
                  <option value="preapproval">Suscripciones</option>
                </select>
              </div>
              <div>
                <Button onClick={searchUnified} disabled={uniLoading}>
                  {uniLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

          {uniItems.length > 0 && (
            <div className="bg-background border rounded-lg overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-muted/50">
                      <th className="py-3 px-4 font-medium">Tipo</th>
                      <th className="py-3 px-4 font-medium">ID</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                      <th className="py-3 px-4 font-medium">Email</th>
                      <th className="py-3 px-4 font-medium">UID</th>
                      <th className="py-3 px-4 font-medium">Fecha</th>
                      <th className="py-3 px-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniItems.map((it) => (
                      <tr key={`${it.type}:${it.id}`} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4">{it.type}</td>
                        <td className="py-3 px-4 font-mono text-xs">{it.id}</td>
                        <td className="py-3 px-4">{it.status || "-"}</td>
                        <td className="py-3 px-4">{it.payer_email || "-"}</td>
                        <td className="py-3 px-4">{it.external_reference || "-"}</td>
                        <td className="py-3 px-4">{it.date ? new Date(it.date).toLocaleString() : "-"}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" onClick={() => reprocessUnified(it)} disabled={uniLoading}>
                            Reprocesar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
