import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteCurrentAccount } from "@/lib/deleteAccount";

const CONFIRMATION_TEXT = "DELETE";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmation !== CONFIRMATION_TEXT) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteCurrentAccount();
      window.location.replace("/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account deletion failed");
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
                Delete account
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Permanently removes your profile, wardrobe items, wardrobe images, generated outfits,
              outfit history, and authentication account. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setConfirmation("");
              setError(null);
            }}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Permanently delete account?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  All ClosetIQ data associated with this account will be permanently deleted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={deleting}
                autoComplete="off"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono outline-none focus:border-destructive"
              />
            </label>

            {error && (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={confirmation !== CONFIRMATION_TEXT || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Deleting everything…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
