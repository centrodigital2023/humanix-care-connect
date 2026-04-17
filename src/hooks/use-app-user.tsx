import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "professional"
  | "family"
  | "institution"
  | "superadmin"
  | "hr_staff"
  | "evaluator";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: AppRole[];
  primaryRole: AppRole;
};

const PRIORITY: AppRole[] = [
  "superadmin",
  "hr_staff",
  "evaluator",
  "institution",
  "family",
  "professional",
];

function pickPrimary(roles: AppRole[]): AppRole {
  for (const r of PRIORITY) if (roles.includes(r)) return r;
  return "family";
}

export function pathForRole(role: AppRole): string {
  switch (role) {
    case "superadmin":
      return "/superadmin";
    case "hr_staff":
      return "/talento-humano";
    case "evaluator":
      return "/evaluador";
    case "institution":
      return "/dashboard/institucion";
    case "family":
      return "/dashboard/familia";
    case "professional":
    default:
      return "/dashboard/profesional";
  }
}

export function useAppUser(options: { requireAuth?: boolean; allow?: AppRole[] } = {}) {
  const { requireAuth = true, allow } = options;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadUser = async (uid: string, email: string) => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", uid)
          .maybeSingle(),
      ]);
      if (!active) return;
      const list = (roles?.map((r) => r.role) ?? []) as AppRole[];
      const finalRoles = list.length ? list : (["family"] as AppRole[]);
      const primary = pickPrimary(finalRoles);

      // If route restricted and user role not allowed → send to their primary panel.
      if (allow && !finalRoles.some((r) => allow.includes(r))) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          navigate({ to: pathForRole(primary), replace: true });
        }
        return;
      }

      setUser({
        id: uid,
        email,
        fullName: profile?.full_name ?? email,
        avatarUrl: profile?.avatar_url ?? null,
        roles: finalRoles,
        primaryRole: primary,
      });
      setLoading(false);
    };

    // 1) Subscribe FIRST so we react to login/logout.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!active) return;
      if (!session) {
        setUser(null);
        if (requireAuth && !redirectedRef.current) {
          redirectedRef.current = true;
          navigate({ to: "/auth", replace: true });
        }
        setLoading(false);
        return;
      }
      // defer to avoid running supabase calls inside the callback synchronously
      setTimeout(() => {
        loadUser(session.user.id, session.user.email ?? "");
      }, 0);
    });

    // 2) Then check existing session.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        if (requireAuth && !redirectedRef.current) {
          redirectedRef.current = true;
          navigate({ to: "/auth", replace: true });
        }
        setLoading(false);
        return;
      }
      loadUser(data.session.user.id, data.session.user.email ?? "");
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return { user, loading, logout };
}
