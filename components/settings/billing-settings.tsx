"use client";

import { useState } from "react";
import { CheckCircle2, Zap, Building, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/hooks/use-toast";

const PLANS = {
    free: {
        name: "Free",
        price: "$0",
        description: "For small teams getting started",
        features: [
            "Up to 5 projects",
            "Up to 10 members",
            "5 GB storage",
            "Basic analytics",
            "Email support",
        ],
    },
    pro: {
        name: "Pro",
        price: "$12/user/mo",
        description: "For growing teams that need more power",
        features: [
            "Unlimited projects",
            "Unlimited members",
            "100 GB storage",
            "Advanced analytics",
            "AI task generation",
            "Priority support",
            "Custom integrations",
        ],
    },
    enterprise: {
        name: "Enterprise",
        price: "Custom",
        description: "For large organizations with custom needs",
        features: [
            "Everything in Pro",
            "SSO / SAML",
            "Audit logs",
            "SLA guarantee",
            "Dedicated support",
            "Custom contracts",
        ],
    },
};

type PlanKey = keyof typeof PLANS;

interface BillingSettingsProps {
    org: any;
}

export function BillingSettings({ org }: BillingSettingsProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const currentPlan: PlanKey = (org.plan as PlanKey) ?? "free";

    const handleUpgrade = async (plan: PlanKey) => {
        if (plan === "enterprise") {
            window.open("mailto:sales@nexusflow.app?subject=Enterprise Inquiry", "_blank");
            return;
        }
        setIsLoading(plan);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan, orgId: org.id }),
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch {
            addToast({ title: "Failed to start checkout", type: "error" });
        } finally {
            setIsLoading(null);
        }
    };

    const handleManageBilling = async () => {
        setIsLoading("portal");
        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId: org.id }),
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch {
            addToast({ title: "Failed to open billing portal", type: "error" });
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Current plan */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        Current Plan
                        <Badge variant={currentPlan === "free" ? "outline" : "default"}>
                            {PLANS[currentPlan].name}
                        </Badge>
                    </CardTitle>
                    <CardDescription>{PLANS[currentPlan].description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {org.stripe_customer_id && (
                        <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={isLoading === "portal"}>
                            {isLoading === "portal" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                            Manage Billing
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Plan comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(([key, plan]) => {
                    const isCurrent = key === currentPlan;
                    const isUpgrade = !isCurrent && key !== "free";
                    return (
                        <Card key={key} className={isCurrent ? "border-primary/50 ring-1 ring-primary/30" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{plan.name}</CardTitle>
                                    {isCurrent && <Badge variant="outline" className="text-xs">Current</Badge>}
                                </div>
                                <p className="text-2xl font-bold">{plan.price}</p>
                                <CardDescription className="text-xs">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <ul className="space-y-1.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {!isCurrent && (
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        variant={key === "enterprise" ? "outline" : "default"}
                                        onClick={() => handleUpgrade(key)}
                                        disabled={!!isLoading}
                                    >
                                        {isLoading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : key === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
