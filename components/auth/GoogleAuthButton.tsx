"use client";

import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/supabase/config";

type GoogleAuthButtonProps = {
  redirectTo?: string;
  label?: string;
  disabled?: boolean;
};

function GoogleIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.805 12.23c0-.676-.06-1.326-.173-1.95H12v3.69h5.5a4.7 4.7 0 0 1-2.04 3.084v2.56h3.304c1.934-1.78 3.041-4.404 3.041-7.384Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.076-.914 6.768-2.477l-3.304-2.56c-.914.613-2.082.978-3.464.978-2.66 0-4.914-1.797-5.72-4.212H2.864v2.642A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.729A5.992 5.992 0 0 1 5.96 12c0-.6.11-1.183.32-1.729V7.63H2.864A10 10 0 0 0 2 12c0 1.612.386 3.14 1.067 4.37l3.213-2.641Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.06c1.5 0 2.846.517 3.906 1.532l2.928-2.928C17.07 3.023 14.754 2 12 2A10 10 0 0 0 2.864 7.63l3.417 2.641C7.086 7.857 9.34 6.06 12 6.06Z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Lance le flux OAuth Google Supabase avec redirection vers le callback applicatif.
 */
export function GoogleAuthButton({
  redirectTo = "/dashboard",
  label = "Continuer avec Google",
  disabled = false,
}: GoogleAuthButtonProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const callbackUrl = useMemo(() => {
    const url = new URL(getAppUrl("/auth/callback"));
    const safeRedirectTo =
      redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    url.searchParams.set("next", safeRedirectTo);
    return url.toString();
  }, [redirectTo]);

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (oauthError) {
      const message =
        oauthError instanceof Error
          ? oauthError.message
          : "Connexion Google indisponible pour le moment.";

      if (message.toLowerCase().includes("provider")) {
        setError("Google n'est pas encore activé dans Supabase pour ce projet.");
      } else {
        setError(message);
      }

      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Button
        variant="outline"
        fullWidth
        data-testid="google-auth-button"
        loading={loading}
        disabled={disabled || !hydrated}
        icon={<GoogleIcon />}
        onClick={() => void handleGoogleAuth()}
        className="border-slate-200 bg-white text-[#0A0A0A] hover:bg-slate-50"
      >
        {label}
      </Button>
    </div>
  );
}
