import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";
import { z } from "zod";

const bodySchema = z.object({
    plan: z.enum(["pro"]),
    orgId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { plan, orgId } = parsed.data;

    const { data: org } = await supabase.from("organizations").select("name, stripe_customer_id").eq("id", orgId).single();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: org.name,
            metadata: { org_id: orgId, user_id: user.id },
        });
        customerId = customer.id;
        await supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", orgId);
    }

    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${orgId}/settings?tab=billing&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${orgId}/settings?tab=billing`,
        metadata: { org_id: orgId },
        subscription_data: { metadata: { org_id: orgId } },
        allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
}
