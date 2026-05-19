import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId } = await req.json();
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const { data: org } = await supabase.from("organizations").select("stripe_customer_id").eq("id", orgId).single();
    if (!org?.stripe_customer_id) return NextResponse.json({ error: "No billing setup" }, { status: 400 });

    const session = await stripe.billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${orgId}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
}
