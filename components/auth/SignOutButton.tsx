"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SignOutButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  label?: string;
};

/**
 * Déconnecte l'utilisateur courant quel que soit le mode actif.
 */
export function SignOutButton({
  label = "Se déconnecter",
  loading,
  ...props
}: SignOutButtonProps): JSX.Element {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      localStorage.removeItem("minealert-demo-user");

      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      }

      if (typeof window !== "undefined") {
        window.location.assign("/login");
        return;
      }

      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      {...props}
      data-testid="sign-out-button"
      type="button"
      onClick={() => void handleSignOut()}
      loading={loading || isSigningOut}
    >
      {label}
    </Button>
  );
}
