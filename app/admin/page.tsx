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
import { MobileAdmin } from "@/components/mobile/mobile-admin";
import { ADMIN_EMAIL } from "@/app/api/admin/users/route";

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
        />
      </div>

      {/* Desktop Layout - only show on desktop */}
      <div className="hidden md:block mx-auto max-w-5xl w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin – Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4 gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Registered</th>
                    <th className="py-2">Premium</th>
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
                      <tr key={u.uid} className="border-b last:border-0">
                        <td className="py-2 pr-4">{u.email || "—"}</td>
                        <td className="py-2 pr-4">{u.displayName || "—"}</td>
                        <td className="py-2 pr-4">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-2">
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
