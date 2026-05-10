"use client";

import type {
  AdminUsersTableProps,
  AdminUser,
  SortDirection,
} from "@/types/admin";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Copy,
  Crown,
  Hash,
  Mail,
  RefreshCw,
  User,
} from "lucide-react";

export function AdminUsersTable({
  adminEmail,
  users,
  loading,
  sortDir,
  onSortChange,
  onRefresh,
  onTogglePremium,
  onCopy,
  searchQuery,
  onSearchChange,
  variant = "desktop",
  className,
}: AdminUsersTableProps) {
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => {
      return (
        (user.email || "").toLowerCase().includes(query) ||
        (user.displayName || "").toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const createdA = a.createdAt ?? 0;
      const createdB = b.createdAt ?? 0;
      return sortDir === "newest" ? createdB - createdA : createdA - createdB;
    });
  }, [filteredUsers, sortDir]);

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Admin Panel
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={onRefresh}
                className="h-8 w-8"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    loading ? "animate-spin text-muted-foreground" : ""
                  )}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{sortedUsers.length} users</span>
              <label className="flex items-center gap-2">
                <span>Sort</span>
                <select
                  className="border rounded px-2 py-1 text-xs bg-background"
                  value={sortDir}
                  onChange={(event) =>
                    onSortChange(event.target.value as SortDirection)
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
            </div>
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por email, nombre o UID"
              className="text-sm"
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {sortedUsers.map((user) => (
            <Card key={user.uid} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="font-medium text-sm">
                      {user.displayName || "No Name"}
                    </div>
                    {user.premium && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={user.premium}
                    onCheckedChange={(value) => onTogglePremium(user, value)}
                  />
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs truncate flex-1">
                      {user.uid}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onCopy(user.uid, "UID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedUsers.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border bg-background shadow-sm",
        "overflow-hidden",
        className
      )}
    >
      <header className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Admin - Users</h2>
          <p className="text-sm text-muted-foreground">
            Only visible to {adminEmail}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort</span>
            <select
              className="border rounded px-2 py-1 text-sm bg-background"
              value={sortDir}
              onChange={(event) =>
                onSortChange(event.target.value as SortDirection)
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por email, nombre o UID"
            className="w-full sm:w-64"
          />
          <Button
            variant="secondary"
            disabled={loading}
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", loading ? "animate-spin" : "")}
            />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-h-[32rem] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">UID</th>
              <th className="py-3 px-4 font-medium">Registered</th>
              <th className="py-3 px-4 font-medium">Premium</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr
                key={user.uid}
                className="border-b last:border-b-0 hover:bg-muted/40"
              >
                <td className="py-3 px-4">{user.email || "—"}</td>
                <td className="py-3 px-4">{user.displayName || "-"}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs select-all">
                      {user.uid}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 py-0 h-7"
                      onClick={() => onCopy(user.uid, "UID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="py-3 px-4">
                  <Switch
                    checked={user.premium}
                    onCheckedChange={(value) => onTogglePremium(user, value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedUsers.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
          No users found.
        </div>
      )}
    </section>
  );
}
