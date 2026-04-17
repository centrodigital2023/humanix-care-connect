import { useEffect, useState } from "react";
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

export function useAppUser(options: { requireAuth?: boolean; allow?: AppRole[] } = {}) {
  const { requireAuth = true, allow } = options;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (requireAuth) navigate({ to: "/auth" });
        setLoading(false);
        return;
      }
      const uid = sess.session.user.id;
      const email = sess.session.user.email ?? "";
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", uid).maybeSingle(),
      ]);
      const list = (roles?.map((r) => r.role) ?? []) as AppRole[];
      const primary = pickPrimary(list.length ? list : ["family"]);
      if (allow && !list.some((r) => allow.includes(r))) {
        navigate({ to: "/dashboard" });
        return;
      }
      if (!active) return;
      setUser({
        id: uid,
        email,
        fullName: profile?.full_name ?? email,
        avatarUrl: profile?.avatar_url ?? null,
        roles: list,
        primaryRole: primary,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return { user, loading, logout };
}
