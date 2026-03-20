import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Target,
  Kanban,
  Calendar,
  BarChart3,
  Users,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Layers,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Cadence</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            The modern way to manage your team&apos;s work
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Plan, track, and{" "}
            <span className="text-primary">achieve</span> your goals
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Cadence brings your team&apos;s projects, tasks, and goals together
            in one powerful workspace. Inspired by the best — built for you.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                See features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need
            </h2>
            <p className="mt-2 text-muted-foreground">
              Powerful features to help your team stay organized and productive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Kanban,
                title: "Kanban Boards",
                description:
                  "Visualize your workflow with drag-and-drop boards, columns, and swimlanes.",
              },
              {
                icon: Calendar,
                title: "Timeline & Calendar",
                description:
                  "Plan projects with Gantt charts, calendar views, and deadline tracking.",
              },
              {
                icon: Target,
                title: "Goals & OKRs",
                description:
                  "Set objectives, track key results, and measure progress across your team.",
              },
              {
                icon: BarChart3,
                title: "Dashboards & Reports",
                description:
                  "Get insights with customizable dashboards, charts, and real-time analytics.",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description:
                  "Comments, mentions, file sharing, and real-time updates for seamless teamwork.",
              },
              {
                icon: Zap,
                title: "Automations",
                description:
                  "Automate repetitive tasks with rules, triggers, and workflow automations.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description:
                  "SSO, 2FA, audit logs, and role-based access control for teams of any size.",
              },
              {
                icon: Globe,
                title: "Integrations",
                description:
                  "Connect with Slack, GitHub, Google Calendar, and 100+ other tools.",
              },
              {
                icon: CheckCircle2,
                title: "Task Management",
                description:
                  "Subtasks, dependencies, priorities, custom fields, and recurring tasks.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <feature.icon className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                description: "For individuals and small teams",
                features: [
                  "Up to 10 members",
                  "5 projects",
                  "Basic views",
                  "1 GB storage",
                ],
              },
              {
                name: "Pro",
                price: "$12",
                description: "For growing teams",
                features: [
                  "Unlimited members",
                  "Unlimited projects",
                  "All views & automations",
                  "100 GB storage",
                  "Priority support",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large organizations",
                features: [
                  "Everything in Pro",
                  "SSO & SAML",
                  "Audit logs",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantee",
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-lg border p-6 ${
                  plan.popular
                    ? "border-primary shadow-lg"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="mx-auto max-w-2xl space-y-4">
            {[
              {
                q: "Is Cadence really free?",
                a: "Yes! The free plan includes all core features for up to 10 members and 5 projects. No credit card required.",
              },
              {
                q: "Can I import from Asana, Jira, or Trello?",
                a: "Yes, we support importing from CSV, JSON, and direct imports from popular project management tools.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use industry-standard encryption, regular security audits, and comply with GDPR requirements.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-2xl bg-primary p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mt-2 text-primary-foreground/80">
              Join thousands of teams already using Cadence.
            </p>
            <Link href="/sign-up" className="mt-6 inline-block">
              <Button size="lg" variant="secondary" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Cadence</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Cadence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
