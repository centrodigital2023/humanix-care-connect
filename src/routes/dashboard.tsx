import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pathForRole, type AppRole } from "@/hooks/use-app-user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Mi panel · Humanix" }],
  }),
  component: DashboardRouter,
});

const PRIORITY: AppRole[] = [
  "superadmin",
  "hr_staff",
  "evaluator",
  "institution",
  "family",
  "professional",
];

function DashboardRouter() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verificando sesión...");

  useEffect(() => {
    let active = true;
    let redirected = false;

    const route = async (userId: string) => {
      if (redirected || !active) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!active || redirected) return;
      const list = (roles?.map((x) => x.role) ?? []) as AppRole[];
      const primary = PRIORITY.find((p) => list.includes(p)) ?? "family";
      redirected = true;
      setMsg("Redirigiendo a tu panel...");
      navigate({ to: pathForRole(primary), replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!active) return;
      if (!session) {
        if (!redirected) {
          redirected = true;
          navigate({ to: "/auth", replace: true });
        }
        return;
      }
      setTimeout(() => route(session.user.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        if (!redirected) {
          redirected = true;
          navigate({ to: "/auth", replace: true });
        }
        return;
      }
      route(data.session.user.id);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      {msg}
    </div>
  );
}
