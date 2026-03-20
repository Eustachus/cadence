import { RegisterForm } from "@/components/auth/register-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Get started with Cadence"
      footerText="Already have an account?"
      footerLink="/sign-in"
      footerLinkText="Sign in"
    >
      <RegisterForm />
    </AuthCard>
  );
}
