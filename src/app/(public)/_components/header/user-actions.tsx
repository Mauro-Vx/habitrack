import Link from "next/link";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { DropdownAvatar } from "./user-actions/dropdown-avatar";
import { DashboardButton } from "./user-actions/dashboard-button";
import { PathGuard } from "@/components/auth/path_guard";

export function UserActions() {
  return (
    <div className="flex w-full flex-row-reverse items-center gap-2 lg:gap-4">
      <AuthGuard userStatus="signedIn">
        <DropdownAvatar />
        <DashboardButton />
      </AuthGuard>

      <AuthGuard userStatus="signedOut">
        <PathGuard hideWhen={["/sign-in", "/sign-up", "verification-sent"]}>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </PathGuard>
      </AuthGuard>
    </div>
  );
}
