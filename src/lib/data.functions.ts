import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
});

export const listArtisans = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
        maxRate: z.number().optional(),
        minRating: z.number().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("artisans").select("*").order("rating", { ascending: false });
    if (data.category) q = q.eq("category_slug", data.category);
    if (data.maxRate) q = q.lte("hourly_rate", data.maxRate);
    if (data.minRating) q = q.gte("rating", data.minRating);
    const { data: rows, error } = await q;
    if (error) throw error;
    let result = rows ?? [];
    if (data.search) {
      const s = data.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(s) ||
          (a.bio ?? "").toLowerCase().includes(s) ||
          (a.skills ?? []).some((sk: string) => sk.toLowerCase().includes(s)),
      );
    }
    return result;
  });

export const getArtisan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("artisans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(100),
        email: z.string().email().max(255),
        phone: z.string().min(7).max(20).optional(),
        category_slug: z.string().min(1).max(50),
        years_experience: z.number().int().min(0).max(60),
        hourly_rate: z.number().int().min(500).max(1000000),
        bio: z.string().max(1000).optional(),
        skills: z.array(z.string().max(50)).max(15).default([]),
        location: z.string().max(100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("artisan_registrations").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        artisan_id: z.string().uuid(),
        scheduled_at: z.string(),
        description: z.string().min(5).max(1000),
        address: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: artisan } = await context.supabase
      .from("artisans")
      .select("hourly_rate")
      .eq("id", data.artisan_id)
      .maybeSingle();
    const { data: row, error } = await context.supabase
      .from("bookings")
      .insert({
        customer_id: context.userId,
        artisan_id: data.artisan_id,
        scheduled_at: data.scheduled_at,
        description: data.description,
        address: data.address,
        price: artisan?.hourly_rate ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*, artisans(full_name, avatar_url, category_slug)")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const myRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });

// AI matching
export const aiMatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().min(5).max(500), category: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("artisans").select("*");
    if (data.category) q = q.eq("category_slug", data.category);
    const { data: artisans, error } = await q;
    if (error) throw error;
    const pool = (artisans ?? []).slice(0, 30);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      // Fallback: simple heuristic
      const top = pool
        .filter((a) => a.available)
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, 3)
        .map((a) => ({ id: a.id, reason: `Top-rated ${a.category_slug} (${a.rating}★)` }));
      return { matches: top, pool };
    }

    const prompt = `You are SkillGate's matching engine. Given this customer request and artisan list, pick the TOP 3 best matches. Consider price-fit, rating, availability, and skill relevance.

Customer request: "${data.query}"

Artisans:
${pool.map((a) => `id=${a.id} | ${a.full_name} | ${a.category_slug} | ₦${a.hourly_rate}/hr | ${a.rating}★ | ${a.completed_jobs} jobs | skills: ${(a.skills ?? []).join(", ")} | ${a.available ? "available" : "busy"}`).join("\n")}

Respond ONLY with valid JSON: {"matches":[{"id":"<uuid>","reason":"<one short sentence>"}]}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json();
      const content = j.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      return { matches: (parsed.matches ?? []).slice(0, 3), pool };
    } catch (e) {
      console.error("AI match failed", e);
      const top = pool
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, 3)
        .map((a) => ({ id: a.id, reason: `Top rated (${a.rating}★)` }));
      return { matches: top, pool };
    }
  });