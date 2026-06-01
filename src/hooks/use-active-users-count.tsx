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
          .eq("availability_status", "available");

        // Obtener conteo de familias activas
        const { count: famCount } = await supabase
          .from("family_profiles")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        // Obtener conteo de instituciones activas
        const { count: instCount } = await supabase
          .from("institution_profiles")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

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

    // Suscribirse a cambios en tiempo real
    const channels = [
      supabase
        .channel("active_professionals")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "professional_profiles",
            filter: "availability_status=eq.available",
          },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel("active_families")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "family_profiles",
            filter: "active=eq.true",
          },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel("active_institutions")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "institution_profiles",
            filter: "active=eq.true",
          },
          () => fetchCounts()
        )
        .subscribe(),
    ];

    return () => {
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
