import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://default-project.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "default-anon-key";

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options as any)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isDashboardRoute = pathname.startsWith("/org");
    const isPublicRoute = pathname === "/" || pathname.startsWith("/pricing") || pathname.startsWith("/about");

    // Redirect unauthenticated users away from dashboard
    if (!user && isDashboardRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
}
