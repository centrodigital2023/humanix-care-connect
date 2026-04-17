import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, FileCheck, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Navbar } from "@/components/humanix/Navbar";

export const Route = createFileRoute("/evaluador")({
  head: () => ({ meta: [{ title: "Evaluador · Humanix" }] }),
  component: EvaluatorPage,
});

function EvaluatorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

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
      const allowed = roles?.some((r) =>
        ["superadmin", "evaluator", "hr_staff"].includes(r.role)
      );
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
      .from("professional_documents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
  };

  const review = async (doc: any, status: "approved" | "rejected") => {
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("professional_documents")
      .update({
        status,
        reviewer_note: notes[doc.id] || null,
        reviewed_by: sess.session?.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
    if (error) return toast.error(error.message);

    if (status === "approved" && doc.doc_type === "rethus") {
      await supabase
        .from("professional_profiles")
        .update({ rethus_verified: true })
        .eq("user_id", doc.user_id);
    }
    toast.success(status === "approved" ? "Documento aprobado" : "Documento rechazado");
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
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Evaluador de documentos</h1>
            <p className="text-sm text-muted-foreground">
              {docs.length} documentos pendientes de revisión
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {docs.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              No hay documentos pendientes. Buen trabajo.
            </Card>
          )}
          {docs.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {d.doc_type}
                  </Badge>
                  <p className="text-sm font-medium">{d.file_name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={d.file_url} target="_blank" rel="noreferrer">
                    Ver <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
              <Textarea
                placeholder="Nota para el profesional (opcional)"
                value={notes[d.id] || ""}
                onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                className="mb-3"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="hero" onClick={() => review(d, "approved")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                </Button>
                <Button size="sm" variant="outline" onClick={() => review(d, "rejected")}>
                  <XCircle className="h-4 w-4 mr-1" /> Rechazar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
