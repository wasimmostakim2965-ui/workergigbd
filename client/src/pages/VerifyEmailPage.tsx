import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    verifyMutation.mutate(
      { token },
      {
        onSuccess: () => setStatus("success"),
        onError: () => setStatus("error"),
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center bg-white border border-border rounded-2xl shadow-float p-10">
        {status === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h1 className="font-heading text-lg font-bold text-foreground">Verifying your email…</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="font-heading text-xl font-bold text-foreground mb-2">Email verified!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              You can now request withdrawals from your Earnings page.
            </p>
            <Link href="/earnings">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Earnings
              </Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="font-heading text-xl font-bold text-foreground mb-2">Link invalid or expired</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Please request a new verification email from your Earnings page.
            </p>
            <Link href="/earnings">
              <Button variant="outline">Back to Earnings</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
