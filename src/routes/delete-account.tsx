import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";

export const Route = createFileRoute("/delete-account")({
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage permanent actions for your ClosetIQ account.
        </p>
      </div>

      <DeleteAccountSection />
    </div>
  );
}
