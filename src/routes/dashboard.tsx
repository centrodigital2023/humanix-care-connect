import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Mi panel · Humanix" }],
  }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verificando sesión...");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      const userId = sess.session.user.id;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!active) return;
      const r = roles?.map((x) => x.role) ?? [];
      setMsg("Redirigiendo a tu panel...");
      if (r.includes("superadmin")) navigate({ to: "/superadmin" });
      else if (r.includes("hr_staff")) navigate({ to: "/talento-humano" });
      else if (r.includes("evaluator")) navigate({ to: "/evaluador" });
      else if (r.includes("institution")) navigate({ to: "/dashboard/institucion" });
      else if (r.includes("family")) navigate({ to: "/dashboard/familia" });
      else navigate({ to: "/dashboard/profesional" });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      {msg}
    </div>
  );
}
