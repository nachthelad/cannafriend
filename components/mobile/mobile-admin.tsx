"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Crown, User, Mail, Calendar } from "lucide-react";

type ListedUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  premium: boolean;
  createdAt?: number;
};

interface MobileAdminProps {
  users: ListedUser[];
  loading: boolean;
  sortDir: "newest" | "oldest";
  setSortDir: (dir: "newest" | "oldest") => void;
  fetchUsers: () => void;
  togglePremium: (user: ListedUser, premium: boolean) => void;
}

export function MobileAdmin({
  users,
  loading,
  sortDir,
  setSortDir,
  fetchUsers,
  togglePremium,
}: MobileAdminProps) {
  const sortedUsers = [...users].sort((a, b) => {
    const ca = a.createdAt || 0;
    const cb = b.createdAt || 0;
    return sortDir === "newest" ? cb - ca : ca - cb;
  });

  const UserCard = ({ user }: { user: ListedUser }) => (
    <Card className="border-l-4 border-l-primary/20">
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
            onCheckedChange={(val) => togglePremium(user, val)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{user.email || "No email"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={fetchUsers}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {users.length} users total
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort:</label>
              <select
                className="border rounded px-2 py-1 text-sm bg-background"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {sortedUsers.map((user) => (
          <UserCard key={user.uid} user={user} />
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && !loading && (
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