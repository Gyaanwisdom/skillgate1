import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [artisans, bookings, regs, users] = await Promise.all([
      supabaseAdmin.from("artisans").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("bookings").select("id, price", { count: "exact" }),
      supabaseAdmin
        .from("artisan_registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    const revenue = (bookings.data ?? []).reduce((s, b: any) => s + (b.price ?? 0), 0);
    return {
      artisans: artisans.count ?? 0,
      bookings: bookings.count ?? 0,
      pendingRegistrations: regs.count ?? 0,
      users: users.count ?? 0,
      revenue,
    };
  });

export const adminListRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("artisan_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminApproveRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reg, error } = await supabaseAdmin
      .from("artisan_registrations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw error;

    // Try to replace one seed artisan in the same category; else just insert
    const { data: seed } = await supabaseAdmin
      .from("artisans")
      .select("id")
      .eq("category_slug", reg.category_slug)
      .eq("is_seed", true)
      .order("rating", { ascending: true })
      .limit(1)
      .maybeSingle();

    const newRow = {
      full_name: reg.full_name,
      category_slug: reg.category_slug,
      bio: reg.bio,
      hourly_rate: reg.hourly_rate,
      years_experience: reg.years_experience,
      skills: reg.skills,
      location: reg.location,
      avatar_url: `https://i.pravatar.cc/200?u=${reg.id}`,
      is_seed: false,
      verified: true,
      rating: 4.5,
      completed_jobs: 0,
      profile_id: reg.applicant_user_id,
    };

    if (seed) {
      await supabaseAdmin.from("artisans").update(newRow).eq("id", seed.id);
    } else {
      await supabaseAdmin.from("artisans").insert(newRow);
    }

    await supabaseAdmin
      .from("artisan_registrations")
      .update({ status: "approved" })
      .eq("id", data.id);

    // Promote to artisan role if user has account
    if (reg.applicant_user_id) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: reg.applicant_user_id, role: "artisan" })
        .select();
    }
    return { ok: true, replaced: !!seed };
  });

export const adminRejectRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("artisan_registrations")
      .update({ status: "rejected" })
      .eq("id", data.id);
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*, artisans(full_name, category_slug), profiles!bookings_customer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // fallback without join
      const { data: d2 } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return d2 ?? [];
    }
    return data ?? [];
  });

// Dev helper: claim admin role (first user only, or if no admin exists)
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      // Already has admin — only existing admins can promote others (skip)
      const { data: isAdmin } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!isAdmin) throw new Error("Admin already claimed. Ask an existing admin to promote you.");
      return { ok: true, alreadyAdmin: true };
    }
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    return { ok: true, alreadyAdmin: false };
  });