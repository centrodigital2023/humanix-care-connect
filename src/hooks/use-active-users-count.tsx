import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "professional" | "family" | "institution";

export function useActiveUsersCount(_role?: UserRole) {
  const [counts, setCounts] = useState({
    professionals: 0,
    professionalsAvailable: 0,
    families: 0,
    familiesVisible: 0,
    institutions: 0,
    institutionsVisible: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      try {
        const [proTotal, proAvail, famTotal, famVisible, instTotal, instVisible] = await Promise.all([
          // Total profesionales registrados (no bloqueados)
          supabase
            .from("professional_profiles")
            .select("*", { count: "exact", head: true })
            .eq("blocked", false),
          // Profesionales disponibles ahora
          supabase
            .from("professional_profiles")
            .select("*", { count: "exact", head: true })
            .eq("available", true)
            .eq("blocked", false),
          // Total familias con ubicación
          supabase
            .from("public_family_map_safe")
            .select("*", { count: "exact", head: true }),
          // Familias visibles en mapa
          supabase
            .from("public_family_map_safe")
            .select("*", { count: "exact", head: true })
            .eq("visible_on_map", true),
          // Total instituciones con ubicación
          supabase
            .from("public_institutions_safe")
            .select("*", { count: "exact", head: true }),
          // Instituciones visibles en mapa
          supabase
            .from("public_institutions_safe")
            .select("*", { count: "exact", head: true })
            .eq("visible_on_map", true),
        ]);

        if (active) {
          setCounts({
            professionals: proTotal.count ?? 0,
            professionalsAvailable: proAvail.count ?? 0,
            families: famTotal.count ?? 0,
            familiesVisible: famVisible.count ?? 0,
            institutions: instTotal.count ?? 0,
            institutionsVisible: instVisible.count ?? 0,
          });
        }
      } catch (e) {
        console.error("[useActiveUsersCount] fetch failed", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCounts();

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
      case "professional": return counts.professionals;
      case "family": return counts.families;
      case "institution": return counts.institutions;
      default: return 0;
    }
  };

  const getAvailableCount = (roleFilter?: UserRole) => {
    if (!roleFilter) {
      return counts.professionalsAvailable + counts.familiesVisible + counts.institutionsVisible;
    }
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
    // Total registrados
    professionals: counts.professionals,
    families: counts.families,
    institutions: counts.institutions,
    total: counts.professionals + counts.families + counts.institutions,
    // Disponibles/visibles ahora
    professionalsAvailable: counts.professionalsAvailable,
    familiesVisible: counts.familiesVisible,
    institutionsVisible: counts.institutionsVisible,
    totalAvailable: counts.professionalsAvailable + counts.familiesVisible + counts.institutionsVisible,
  };
}
