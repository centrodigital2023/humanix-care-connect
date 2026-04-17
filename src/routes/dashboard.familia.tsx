import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, Heart, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/humanix/Navbar";

export const Route = createFileRoute("/dashboard/familia")({
  head: () => ({ meta: [{ title: "Familia · Humanix" }] }),
  component: FamilyDashboard,
});

function FamilyDashboard() {
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
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Panel familia</h1>
            <p className="text-sm text-muted-foreground">
              Encuentra cuidadores y enfermeros para tu familia
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card className="p-6">
            <Search className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Buscar profesional</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Filtra por especialidad, ciudad y disponibilidad.
            </p>
            <Button variant="hero" asChild className="w-full">
              <Link to="/buscar">Ir al buscador</Link>
            </Button>
          </Card>
          <Card className="p-6">
            <Plus className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Publicar solicitud</h3>
            <p className="text-sm text-muted-foreground mb-4">
              La IA recomendará los profesionales que mejor encajan.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Próximamente
            </Button>
          </Card>
        </div>

        <h2 className="text-lg font-semibold mb-3">Mis solicitudes</h2>
        <div className="grid gap-3">
          {offers.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Aún no has publicado solicitudes.
            </Card>
          )}
          {offers.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center justify-between">
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
