import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "professional" | "family" | "institution";

type Counts = {
  professionals: number;
  professionalsAvailable: number;
  families: number;
  familiesVisible: number;
  institutions: number;
  institutionsVisible: number;
  completedServices: number;
};

const INITIAL: Counts = {
  professionals: 0,
  professionalsAvailable: 0,
  families: 0,
  familiesVisible: 0,
  institutions: 0,
  institutionsVisible: 0,
  completedServices: 0,
};

export function useActiveUsersCount(_role?: UserRole) {
  const [counts, setCounts] = useState<Counts>(INITIAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      try {
        // Single SECURITY DEFINER RPC — bypasses RLS, returns real totals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [rpcRes, famVisibleRes, instVisibleRes] = await Promise.all([
          (supabase.rpc as any)("get_platform_counts").single(),

          // Visible-on-map counts (for X/Y display in map badges)
          supabase
            .from("public_family_map_safe")
            .select("*", { count: "exact", head: true })
            .eq("visible_on_map", true),

          supabase
            .from("public_institutions_safe")
            .select("*", { count: "exact", head: true }),
        ]);

        if (active && rpcRes.data) {
          const d = rpcRes.data as unknown as {
            professionals_total: number;
            professionals_available: number;
            families_total: number;
            institutions_total: number;
            completed_services: number;
          };
          setCounts({
            professionals: Number(d.professionals_total ?? 0),
            professionalsAvailable: Number(d.professionals_available ?? 0),
            families: Number(d.families_total ?? 0),
            familiesVisible: famVisibleRes.count ?? 0,
            institutions: Number(d.institutions_total ?? 0),
            institutionsVisible: instVisibleRes.count ?? 0,
            completedServices: Number(d.completed_services ?? 0),
          });
        }
      } catch (e) {
        console.error("[useActiveUsersCount] fetch failed", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCounts();

    // Realtime: re-fetch on any profile change
    const suffix = Math.random().toString(36).slice(2, 8);
    const channels = [
      supabase
        .channel(`active_professionals_${suffix}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "professional_profiles" }, () => fetchCounts())
        .subscribe(),
      supabase
        .channel(`active_families_${suffix}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "family_profiles" }, () => fetchCounts())
        .subscribe(),
      supabase
        .channel(`active_institutions_${suffix}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "institution_profiles" }, () => fetchCounts())
        .subscribe(),
      supabase
        .channel(`active_bookings_${suffix}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_bookings" }, () => fetchCounts())
        .subscribe(),
    ];

    return () => {
      active = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  const getCount = (roleFilter?: UserRole) => {
    if (!roleFilter) return counts.professionals + counts.families + counts.institutions;
    switch (roleFilter) {
      case "professional": return counts.professionals;
      case "family": return counts.families;
      case "institution": return counts.institutions;
      default: return 0;
    }
  };

  const getAvailableCount = (roleFilter?: UserRole) => {
    if (!roleFilter) return counts.professionalsAvailable + counts.familiesVisible + counts.institutionsVisible;
    switch (roleFilter) {
      case "professional": return counts.professionalsAvailable;
      case "family": return counts.familiesVisible;
      case "institution": return counts.institutionsVisible;
      default: return 0;
    }
  };

  return {
    counts,
    loading,
    getCount,
    getAvailableCount,
    // Totales registrados
    professionals: counts.professionals,
    families: counts.families,
    institutions: counts.institutions,
    total: counts.professionals + counts.families + counts.institutions,
    completedServices: counts.completedServices,
    // Disponibles/visibles ahora mismo
    professionalsAvailable: counts.professionalsAvailable,
    familiesVisible: counts.familiesVisible,
    institutionsVisible: counts.institutionsVisible,
    totalAvailable: counts.professionalsAvailable + counts.familiesVisible + counts.institutionsVisible,
  };
}
