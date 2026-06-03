import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "professional" | "family" | "institution";

export function useActiveUsersCount(role?: UserRole) {
  const [counts, setCounts] = useState({
    professionals: 0,
    families: 0,
    institutions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      try {
        // Obtener conteo de profesionales disponibles
        const { count: proCount } = await supabase
          .from("professional_profiles")
          .select("*", { count: "exact", head: true })
          .eq("available", true);

        // Obtener conteo de familias activas
        const { count: famCount } = await supabase
          .from("family_profiles")
          .select("*", { count: "exact", head: true })
          .eq("visible_on_map", true);

        // Obtener conteo de instituciones activas
        const { count: instCount } = await supabase
          .from("institution_profiles")
          .select("*", { count: "exact", head: true })
          .eq("visible_on_map", true);

        if (active) {
          setCounts({
            professionals: proCount ?? 0,
            families: famCount ?? 0,
            institutions: instCount ?? 0,
          });
        }
      } catch (e) {
        console.error("[useActiveUsersCount] fetch failed", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCounts();

    // Suscribirse a cambios en tiempo real (nombres únicos para evitar
    // "cannot add callbacks after subscribe" en StrictMode/remounts)
    const suffix = Math.random().toString(36).slice(2, 8);
    const channels = [
      supabase
        .channel(`active_professionals_${suffix}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "professional_profiles",
            filter: "available=eq.true",
          },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel(`active_families_${suffix}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "family_profiles",
            filter: "visible_on_map=eq.true",
          },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel(`active_institutions_${suffix}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "institution_profiles",
            filter: "visible_on_map=eq.true",
          },
          () => fetchCounts()
        )
        .subscribe(),
    ];

    return () => {
      active = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  const getCount = (roleFilter?: UserRole) => {
    if (!roleFilter) {
      return counts.professionals + counts.families + counts.institutions;
    }
    switch (roleFilter) {
      case "professional":
        return counts.professionals;
      case "family":
        return counts.families;
      case "institution":
        return counts.institutions;
      default:
        return 0;
    }
  };

  return {
    counts,
    loading,
    getCount,
    professionals: counts.professionals,
    families: counts.families,
    institutions: counts.institutions,
    total: counts.professionals + counts.families + counts.institutions,
  };
}
