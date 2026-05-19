import Link from "next/link";
import { ArrowRight, Zap, Users, BarChart3, GitBranch, Shield, Globe, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
    {
        icon: GitBranch,
        title: "Real-Time Kanban Boards",
        description: "Drag-and-drop tasks with live updates synced instantly across your entire team.",
        color: "text-violet-500",
        bg: "bg-violet-500/10",
    },
    {
        icon: Zap,
        title: "AI-Powered Task Generation",
        description: "Describe your feature and let AI break it down into actionable tasks with smart priorities.",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
    },
    {
        icon: Users,
        title: "Multi-Org Workspace",
        description: "Manage multiple organizations with granular RBAC roles — owner, admin, member, viewer.",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        icon: BarChart3,
        title: "Sprint Analytics",
        description: "Velocity tracking, burndown charts, and completion metrics to optimize your team's flow.",
        color: "text-green-500",
        bg: "bg-green-500/10",
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        description: "Row-level security, end-to-end encryption, audit logs, and SOC2-ready infrastructure.",
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
    {
        icon: Globe,
        title: "Built to Scale",
        description: "Multi-region Supabase with Postgres partitioning, Redis caching, and CDN delivery.",
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
    },
];

const testimonials = [
    {
        quote: "NexusFlow cut our sprint planning from 3 hours to 30 minutes. The AI task generation is magic.",
        author: "Sarah Chen",
        role: "Engineering Manager, Series B Startup",
        avatar: "SC",
    },
    {
        quote: "Finally a PM tool that doesn't feel like it was designed in 2010. The real-time sync is buttery smooth.",
        author: "Marcus Rodriguez",
        role: "CTO, FinTech Scale-Up",
        avatar: "MR",
    },
    {
        quote: "We moved 200 engineers from Jira to NexusFlow in a weekend. Zero regrets.",
        author: "Priya Sharma",
        role: "Director of Engineering, Enterprise SaaS",
        avatar: "PS",
    },
];

const stats = [
    { value: "50K+", label: "Teams using NexusFlow" },
    { value: "2.4M+", label: "Tasks completed" },
    { value: "99.99%", label: "Uptime SLA" },
    { value: "< 50ms", label: "Global p99 latency" },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* ── Nav ─────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">NexusFlow</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                        <Link href="#testimonials" className="hover:text-foreground transition-colors">Customers</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/register">
                                Start Free <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="container py-24 md:py-32 text-center">
                <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    Trusted by 50,000+ engineering teams worldwide
                </Badge>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                    Project management
                    <br />
                    <span className="text-primary">built for builders</span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                    Real-time kanban boards, AI-powered task generation, sprint analytics, and
                    multi-org workspaces. Everything your team needs — nothing they don&apos;t.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Button size="lg" className="text-base px-8 h-12" asChild>
                        <Link href="/register">
                            Get Started Free <ArrowRight className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                        <Link href="#features">See Features</Link>
                    </Button>
                </div>

                {/* Dashboard preview */}
                <div className="relative mx-auto max-w-5xl rounded-xl border bg-muted/30 shadow-2xl overflow-hidden">
                    <div className="bg-muted/50 border-b flex items-center gap-2 px-4 py-3">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-400" />
                            <div className="h-3 w-3 rounded-full bg-yellow-400" />
                            <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 mx-4 h-5 rounded bg-muted" />
                    </div>
                    <div className="p-6 grid grid-cols-4 gap-3 min-h-[320px]">
                        {["Backlog", "To Do", "In Progress", "Done"].map((col, i) => (
                            <div key={col} className="space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col}</div>
                                {Array.from({ length: i === 2 ? 3 : i === 0 ? 4 : 2 }).map((_, j) => (
                                    <div key={j} className="rounded-lg border bg-background p-3 space-y-2 shadow-sm">
                                        <div className="h-3 rounded bg-muted animate-pulse" />
                                        <div className="h-2.5 w-3/4 rounded bg-muted animate-pulse" style={{ animationDelay: `${j * 100}ms` }} />
                                        <div className="flex gap-1.5">
                                            <div className="h-4 w-12 rounded-full bg-primary/20" />
                                            <div className="h-4 w-4 rounded-full bg-muted" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats ───────────────────────────────────────────── */}
            <section className="border-y bg-muted/30">
                <div className="container py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ────────────────────────────────────────── */}
            <section id="features" className="container py-24">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">Features</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Everything your team needs
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Built with the patterns used by Google, Meta, and Amazon — and open enough
                        to adapt to how your team actually works.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow group"
                            >
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bg} mb-4`}>
                                    <Icon className={`h-6 w-6 ${feature.color}`} />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ── Testimonials ────────────────────────────────────── */}
            <section id="testimonials" className="bg-muted/30 border-y">
                <div className="container py-24">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4">Testimonials</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Loved by engineering teams
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <div key={t.author} className="rounded-xl border bg-card p-6 flex flex-col gap-4">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{t.author}</div>
                                        <div className="text-xs text-muted-foreground">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ─────────────────────────────────────────── */}
            <section id="pricing" className="container py-24">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">Pricing</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Simple, transparent pricing
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {[
                        {
                            name: "Free", price: "$0", description: "For small teams getting started",
                            features: ["Up to 5 members", "3 projects", "Kanban boards", "Basic analytics"],
                            cta: "Get Started",
                        },
                        {
                            name: "Pro", price: "$12", description: "For growing engineering teams", highlight: true,
                            features: ["Up to 50 members", "20 projects", "AI task generation", "Sprint analytics", "Priority support"],
                            cta: "Start Pro Trial",
                        },
                        {
                            name: "Enterprise", price: "$49", description: "For large organizations",
                            features: ["Unlimited members", "Unlimited projects", "SSO / SAML", "Audit logs", "SLA guarantees", "Dedicated CSM"],
                            cta: "Contact Sales",
                        },
                    ].map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-xl border p-6 flex flex-col ${plan.highlight ? "border-primary shadow-lg shadow-primary/10 relative" : ""}`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="shadow-sm">Most Popular</Badge>
                                </div>
                            )}
                            <div className="mb-6">
                                <div className="text-lg font-bold mb-1">{plan.name}</div>
                                <div className="flex items-end gap-1 mb-2">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.price !== "$0" && <span className="text-muted-foreground text-sm mb-1">/user/mo</span>}
                                </div>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                            <ul className="space-y-2.5 flex-1 mb-6">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button variant={plan.highlight ? "default" : "outline"} asChild>
                                <Link href="/register">{plan.cta}</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <section className="border-t">
                <div className="container py-24 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Ready to ship faster?
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                        Join 50,000+ teams. Free forever for small teams. No credit card required.
                    </p>
                    <Button size="lg" className="h-12 px-8 text-base" asChild>
                        <Link href="/register">
                            Create your workspace <ArrowRight className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────── */}
            <footer className="border-t bg-muted/30">
                <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                            <Zap className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-semibold text-sm">NexusFlow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} NexusFlow Inc. Built with Next.js + Supabase.
                    </p>
                </div>
            </footer>
        </div>
    );
}
