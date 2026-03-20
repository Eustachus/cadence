import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      footerText="Don't have an account?"
      footerLink="/sign-up"
      footerLinkText="Sign up"
    >
      <LoginForm />
    </AuthCard>
  );
}
