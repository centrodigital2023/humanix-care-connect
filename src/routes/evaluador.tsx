import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  LayoutDashboard,
  Users,
  Search,
  ShieldAlert,
  ScrollText,
  Megaphone,
  Mail,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";

export const Route = createFileRoute("/evaluador")({
  head: () => ({ meta: [{ title: "Evaluador · Humanix" }] }),
  component: EvaluatorPage,
});

const NAV: NavItem[] = [
  { label: "Overview", to: "/superadmin", icon: LayoutDashboard },
  { label: "Anti-fraude", to: "/superadmin/fraude", icon: ShieldAlert },
  { label: "Auditoría", to: "/superadmin/auditoria", icon: ScrollText },
  { label: "Publicidad", to: "/superadmin/publicidad", icon: Megaphone },
  { label: "CRM", to: "/superadmin/crm", icon: Mail },
  { label: "Talento Humano", to: "/talento-humano", icon: Users },
  { label: "Evaluador", to: "/evaluador", icon: FileCheck },
  { label: "Marketplace", to: "/buscar", icon: Search },
];

type Doc = {
  id: string;
  doc_type: string;
  file_name: string | null;
  file_url: string;
  user_id: string;
  created_at: string;
};

function EvaluatorPage() {
  const { user, loading, logout } = useAppUser({
    allow: ["superadmin", "evaluator", "hr_staff"],
  });
  const [docs, setDocs] = useState<Doc[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase
      .from("professional_documents")
      .select("id, doc_type, file_name, file_url, user_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as Doc[]);
    setBusy(false);
  };

  const review = async (doc: Doc, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("professional_documents")
      .update({
        status,
        reviewer_note: notes[doc.id] || null,
        reviewed_by: user?.id,
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

  const aiValidate = async (doc: Doc) => {
    toast.loading("Validando con IA…", { id: `ai-${doc.id}` });
    const { data, error } = await supabase.functions.invoke("document-verifier", {
      body: { document_id: doc.id },
    });
    toast.dismiss(`ai-${doc.id}`);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`IA: ${data?.score ?? "?"}/100 — ${data?.recommendation ?? "validado"}`);
    await load();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      nav={NAV}
      title="Evaluador de documentos"
      subtitle={`${docs.length} documento${docs.length === 1 ? "" : "s"} pendiente${docs.length === 1 ? "" : "s"} de revisión.`}
      crumbs={[{ label: "Inicio", to: "/" }, { label: "Staff", to: "/superadmin" }, { label: "Evaluador" }]}
      badge={{ label: "Staff", tone: "bio" }}
    >
      <div className="grid gap-4 max-w-4xl">
        {busy && <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />}
        {!busy && docs.length === 0 && (
          <Card className="p-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-biosensor mx-auto mb-3" />
            <p className="font-semibold">¡Bandeja vacía!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay documentos pendientes. Excelente trabajo.
            </p>
          </Card>
        )}
        {docs.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <Badge variant="secondary" className="mb-2 uppercase tracking-wider">
                  {d.doc_type}
                </Badge>
                <p className="text-sm font-medium">{d.file_name || "Sin nombre"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString("es-CO")}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={d.file_url} target="_blank" rel="noreferrer">
                  Abrir <ExternalLink className="h-3 w-3 ml-1" />
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
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="hero" onClick={() => review(d, "approved")}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
              </Button>
              <Button size="sm" variant="outline" onClick={() => review(d, "rejected")}>
                <XCircle className="h-4 w-4 mr-1" /> Rechazar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => aiValidate(d)}>
                <Sparkles className="h-4 w-4 mr-1" /> Validar IA
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
