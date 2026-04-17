import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Users, CheckCircle2, XCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Navbar } from "@/components/humanix/Navbar";

export const Route = createFileRoute("/talento-humano")({
  head: () => ({ meta: [{ title: "Talento Humano · Humanix" }] }),
  component: HRPage,
});

function HRPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pros, setPros] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      const allowed = roles?.some((r) => ["superadmin", "hr_staff"].includes(r.role));
      if (!allowed) {
        toast.error("Acceso restringido");
        navigate({ to: "/dashboard" });
        return;
      }
      await load();
      setLoading(false);
    })();
  }, [navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("professional_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setPros(data ?? []);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("professional_profiles")
      .update({ verified: !current })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(!current ? "Profesional verificado" : "Verificación retirada");
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Talento Humano</h1>
            <p className="text-sm text-muted-foreground">Gestiona profesionales registrados</p>
          </div>
        </div>

        <div className="grid gap-4">
          {pros.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay profesionales aún.</p>
          )}
          {pros.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{p.specialty || "Sin especialidad"}</h3>
                    {p.verified && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verificado
                      </Badge>
                    )}
                    {p.ai_preapproved && <Badge variant="secondary">IA pre-aprobado</Badge>}
                    {p.rethus_verified && <Badge variant="outline">RETHUS</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {p.bio || "Sin bio"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Trust: {p.trust_score ?? 0}/100</span>
                    <span>Exp: {p.years_experience ?? 0} años</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" /> {p.avg_rating?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={p.verified ? "outline" : "hero"}
                  onClick={() => toggleVerified(p.id, p.verified)}
                >
                  {p.verified ? (
                    <>
                      <XCircle className="h-4 w-4 mr-1" /> Quitar
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Verificar
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
