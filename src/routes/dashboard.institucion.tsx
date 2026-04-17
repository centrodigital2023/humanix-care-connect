import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, Building2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/humanix/Navbar";

export const Route = createFileRoute("/dashboard/institucion")({
  head: () => ({ meta: [{ title: "Institución · Humanix" }] }),
  component: InstitutionDashboard,
});

function InstitutionDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data } = await supabase
        .from("job_offers")
        .select("*")
        .eq("posted_by", sess.session.user.id)
        .order("created_at", { ascending: false });
      setOffers(data ?? []);
      setLoading(false);
    })();
  }, [navigate]);

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
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Panel institución</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus ofertas y aplicaciones de profesionales
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/buscar">
              <Plus className="h-4 w-4 mr-1" /> Buscar talento
            </Link>
          </Button>
        </div>

        <h2 className="text-lg font-semibold mb-3">Ofertas publicadas</h2>
        <div className="grid gap-3">
          {offers.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Aún no tienes ofertas publicadas.
            </Card>
          )}
          {offers.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.city} · {o.modality} · ${o.amount.toLocaleString("es-CO")} COP
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted">{o.status}</span>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
