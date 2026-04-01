import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    redirectTo?: string;
    registered?: string;
  };
};

/**
 * Page serveur de connexion, qui transmet les query params au formulaire client.
 */
export default function LoginPage({
  searchParams,
}: LoginPageProps): JSX.Element {
  return (
    <LoginForm
      callbackError={searchParams?.error}
      redirectTo={searchParams?.redirectTo}
      registered={searchParams?.registered}
    />
  );
}
