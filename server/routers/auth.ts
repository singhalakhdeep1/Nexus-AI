import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createClient } from "@/lib/supabase/server";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc";

export const authRouter = router({
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword(input);
      
      if (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }
      
      return data;
    }),

  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.name,
          },
        },
      });
      
      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      
      return data;
    }),

  signOut: publicProcedure.mutation(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
    
    return { success: true };
  }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  resetPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
      
      return { success: true };
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({
        password: input.password,
      });
      
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
      
      return { success: true };
    }),
});
