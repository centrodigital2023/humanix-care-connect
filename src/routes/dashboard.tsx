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
    let cancelled = false;
    let done = false;

    const go = (to: string) => {
      if (done || cancelled) return;
      done = true;
      // Use replace navigation; fallback to hard redirect if router doesn't unmount.
      navigate({ to, replace: true }).catch(() => {
        if (!cancelled) window.location.replace(to);
      });
      // Safety net: if still mounted after 600ms, force a hard redirect.
      setTimeout(() => {
        if (!cancelled && typeof window !== "undefined" && window.location.pathname === "/dashboard") {
          window.location.replace(to);
        }
      }, 600);
    };

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        go("/auth");
        return;
      }
      setMsg("Redirigiendo a tu panel...");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      if (cancelled) return;
      const list = (roles?.map((x) => x.role) ?? []) as AppRole[];
      const primary = PRIORITY.find((p) => list.includes(p)) ?? "family";
      go(pathForRole(primary));
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      {msg}
    </div>
  );
}
