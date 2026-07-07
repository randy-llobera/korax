"use client";

import type { DashboardUser } from "@/lib/db/dashboard-user";
import { getUserAvatarName } from "@/lib/users/avatar";

import { UserAvatar } from "@/components/auth/user-avatar";
import { formatDate } from "@/components/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileInfoProps {
  user: DashboardUser;
}

export const ProfileInfo = ({ user }: ProfileInfoProps) => {
  const avatarName = getUserAvatarName({
    email: user.email,
    name: user.name,
  });

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your current sign-in identity and profile basics.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <UserAvatar
          name={avatarName}
          image={user.image}
          fallbackLabel={user.email}
          size="lg"
        />

        <div className="min-w-0 space-y-3">
          <div>
            <div className="truncate text-xl font-semibold">{avatarName}</div>
            <div className="truncate text-sm text-muted-foreground">{user.email}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-border/70">
              Joined {formatDate(user.createdAt)}
            </Badge>
            <Badge variant="outline" className="border-border/70">
              {user.hasPassword ? "Email password enabled" : "GitHub sign-in only"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
