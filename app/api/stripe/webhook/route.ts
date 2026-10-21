import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const orgId = session.metadata?.org_id;
            if (orgId) {
                await supabase
                    .from("organizations")
                    .update({ plan: "pro", stripe_subscription_id: session.subscription as string })
                    .eq("id", orgId);
            }
            break;
        }

        case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const orgId = sub.metadata?.org_id;
            if (orgId) {
                const plan = sub.status === "active" ? "pro" : "free";
                await supabase.from("organizations").update({ plan }).eq("id", orgId);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const orgId = sub.metadata?.org_id;
            if (orgId) {
                await supabase
                    .from("organizations")
                    .update({ plan: "free", stripe_subscription_id: null })
                    .eq("id", orgId);
            }
            break;
        }

        default:
            // Unhandled event type — ignore
            break;
    }

    return NextResponse.json({ received: true });
}

// Disable body parsing — Stripe needs raw body for signature verification
export const config = { api: { bodyParser: false } };
