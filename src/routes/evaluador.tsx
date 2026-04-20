import { useEffect, useMemo, useState } from "react";
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
  Ban,
  Trash2,
  Download,
  Eye,
  Star,
  MapPin,
  Briefcase,
  Phone,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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

type Professional = {
  user_id: string;
  avatar_url: string | null;
  specialty: string | null;
  home_city: string | null;
  bio: string | null;
  years_experience: number | null;
  rethus_number: string | null;
  rethus_verified: boolean | null;
  hourly_rate: number | null;
  avg_rating: number | null;
  total_jobs: number | null;
  published: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  verified: boolean | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  work_experience: unknown;
  certifications: unknown;
  languages: string[] | null;
  service_cities: string[] | null;
  social_trust_score: number | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null; phone: string | null };
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  amount: number;
  modality: string;
  status: string;
  blocked: boolean;
  blocked_reason: string | null;
  posted_by: string;
  poster_type: string;
  contact_phone: string | null;
  start_date: string | null;
  end_date: string | null;
  requirements: string[] | null;
  created_at: string;
  poster?: { full_name: string | null; email: string | null };
};

type Doc = {
  id: string;
  doc_type: string;
  file_name: string | null;
  file_url: string;
  user_id: string;
  status: string;
  created_at: string;
  ai_score: number | null;
  ai_notes: string | null;
};

function EvaluatorPage() {
  const { user, loading, logout } = useAppUser({
    allow: ["superadmin", "evaluator", "hr_staff"],
  });

  const [tab, setTab] = useState("profesionales");

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
      title="Panel del evaluador"
      subtitle="Revisa profesionales, ofertas y documentos. Aprueba, bloquea o elimina."
      crumbs={[
        { label: "Inicio", to: "/" },
        { label: "Staff", to: "/superadmin" },
        { label: "Evaluador" },
      ]}
      badge={{ label: "Staff", tone: "bio" }}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="profesionales">
            <Users className="h-4 w-4 mr-1" /> Profesionales
          </TabsTrigger>
          <TabsTrigger value="ofertas">
            <Briefcase className="h-4 w-4 mr-1" /> Ofertas familias
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileCheck className="h-4 w-4 mr-1" /> Documentos pendientes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profesionales">
          <ProfessionalsTab reviewerId={user.id} />
        </TabsContent>
        <TabsContent value="ofertas">
          <OffersTab reviewerId={user.id} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocsTab reviewerId={user.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------------------------- PROFESIONALES ---------------------------- */

function ProfessionalsTab({ reviewerId }: { reviewerId: string }) {
  const [pros, setPros] = useState<Professional[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "blocked">("all");
  const [selected, setSelected] = useState<Professional | null>(null);

  const load = async () => {
    setBusy(true);
    const { data: rows } = await supabase
      .from("professional_profiles")
      .select(
        "user_id, avatar_url, specialty, home_city, bio, years_experience, rethus_number, rethus_verified, hourly_rate, avg_rating, total_jobs, published, blocked, blocked_reason, verified, ai_summary, ai_strengths, work_experience, certifications, languages, service_cities, social_trust_score, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    const userIds = (rows ?? []).map((r) => r.user_id);
    let profiles: Array<{ user_id: string; full_name: string | null; email: string | null; phone: string | null }> = [];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      profiles = profs ?? [];
    }
    const byId = new Map(profiles.map((p) => [p.user_id, p]));
    const merged = (rows ?? []).map((r) => ({
      ...r,
      profile: byId.get(r.user_id),
    })) as Professional[];

    // Sort by full name
    merged.sort((a, b) =>
      (a.profile?.full_name || "").localeCompare(b.profile?.full_name || "", "es", {
        sensitivity: "base",
      }),
    );
    setPros(merged);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pros.filter((p) => {
      if (filter === "pending" && p.published) return false;
      if (filter === "published" && (!p.published || p.blocked)) return false;
      if (filter === "blocked" && !p.blocked) return false;
      if (!needle) return true;
      return (
        p.profile?.full_name?.toLowerCase().includes(needle) ||
        p.profile?.email?.toLowerCase().includes(needle) ||
        p.specialty?.toLowerCase().includes(needle) ||
        p.home_city?.toLowerCase().includes(needle)
      );
    });
  }, [pros, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar por nombre, email, especialidad, ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {(["all", "pending", "published", "blocked"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "published" ? "Publicados" : "Bloqueados"}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} profesional{filtered.length === 1 ? "" : "es"}
        </span>
      </div>

      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No hay profesionales que coincidan.
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <Card
              key={p.user_id}
              className="p-4 flex items-center gap-4 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => setSelected(p)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback>
                  {(p.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">
                    {p.profile?.full_name || "Sin nombre"}
                  </p>
                  {p.blocked && (
                    <Badge variant="destructive" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" /> Bloqueado
                    </Badge>
                  )}
                  {p.published && !p.blocked && (
                    <Badge className="bg-biosensor/20 text-biosensor text-xs">Publicado</Badge>
                  )}
                  {!p.published && !p.blocked && (
                    <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                  )}
                  {p.rethus_verified && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-biosensor" /> RETHUS
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.specialty || "Sin especialidad"} · {p.home_city || "Sin ciudad"}
                  {p.avg_rating ? ` · ⭐ ${Number(p.avg_rating).toFixed(1)}` : ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">{p.profile?.email}</p>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" /> Revisar
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ProfessionalDetailDialog
          pro={selected}
          reviewerId={reviewerId}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function ProfessionalDetailDialog({
  pro,
  reviewerId,
  onClose,
  onChanged,
}: {
  pro: Professional;
  reviewerId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [refs, setRefs] = useState<Array<{ id: string; full_name: string; phone: string; relation: string | null; ref_type: string; verified: boolean }>>([]);
  const [blockReason, setBlockReason] = useState(pro.blocked_reason ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ doc: Doc; url: string; kind: "pdf" | "image" | "office" | "other" } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadAll = async () => {
    const [docsRes, refsRes] = await Promise.all([
      supabase
        .from("professional_documents")
        .select("id, doc_type, file_name, file_url, user_id, status, created_at, ai_score, ai_notes")
        .eq("user_id", pro.user_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("professional_references")
        .select("id, full_name, phone, relation, ref_type, verified")
        .eq("user_id", pro.user_id),
    ]);
    setDocs((docsRes.data ?? []) as Doc[]);
    setRefs((refsRes.data ?? []) as typeof refs);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro.user_id]);

  const approve = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        published: true,
        blocked: false,
        blocked_reason: null,
        blocked_at: null,
        blocked_by: null,
        verified: true,
        published_at: new Date().toISOString(),
      })
      .eq("user_id", pro.user_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profesional aprobado y publicado");
    onChanged();
    onClose();
  };

  const block = async () => {
    if (!blockReason.trim()) {
      toast.error("Escribe el motivo del bloqueo para que el profesional lo vea");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        published: false,
        blocked: true,
        blocked_reason: blockReason.trim(),
        blocked_at: new Date().toISOString(),
        blocked_by: reviewerId,
      })
      .eq("user_id", pro.user_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profesional bloqueado");
    onChanged();
    onClose();
  };

  const unblock = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("professional_profiles")
      .update({ blocked: false, blocked_reason: null, blocked_at: null, blocked_by: null })
      .eq("user_id", pro.user_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bloqueo retirado");
    onChanged();
    onClose();
  };

  const hardDelete = async () => {
    setBusy(true);
    // Delete profile-related rows. Auth user stays alive.
    const { error } = await supabase
      .from("professional_profiles")
      .delete()
      .eq("user_id", pro.user_id);
    // Also remove related professional data (docs + refs) — best effort
    await supabase.from("professional_documents").delete().eq("user_id", pro.user_id);
    await supabase.from("professional_references").delete().eq("user_id", pro.user_id);
    // Remove professional role if present
    await supabase.from("user_roles").delete().eq("user_id", pro.user_id).eq("role", "professional");
    setBusy(false);
    setConfirmDelete(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil profesional eliminado");
    onChanged();
    onClose();
  };

  const deleteDoc = async (d: Doc) => {
    const { error } = await supabase.from("professional_documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    // Best-effort: remove file from storage if path matches bucket
    try {
      const marker = "/professional-docs/";
      const idx = d.file_url.indexOf(marker);
      if (idx >= 0) {
        const path = d.file_url.slice(idx + marker.length);
        await supabase.storage.from("professional-docs").remove([path]);
      }
    } catch {
      /* ignore */
    }
    toast.success("Documento eliminado");
    loadAll();
  };

  const downloadDoc = async (d: Doc) => {
    // Try signed URL for private bucket
    try {
      const marker = "/professional-docs/";
      const idx = d.file_url.indexOf(marker);
      if (idx >= 0) {
        const path = d.file_url.slice(idx + marker.length);
        const { data } = await supabase.storage
          .from("professional-docs")
          .createSignedUrl(path, 60, { download: d.file_name ?? true });
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
          return;
        }
      }
    } catch {
      /* fall through */
    }
    window.open(d.file_url, "_blank");
  };

  const getStoragePath = (fileUrl: string): string | null => {
    const marker = "/professional-docs/";
    const idx = fileUrl.indexOf(marker);
    if (idx >= 0) return fileUrl.slice(idx + marker.length);
    if (!fileUrl.includes("://")) return fileUrl;
    return null;
  };

  const detectKind = (name: string | null): "pdf" | "image" | "office" | "other" => {
    const ext = (name ?? "").toLowerCase().split(".").pop() ?? "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic"].includes(ext)) return "image";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "odt", "ods"].includes(ext)) return "office";
    return "other";
  };

  const openPreview = async (d: Doc) => {
    setPreviewLoading(true);
    try {
      const path = getStoragePath(d.file_url);
      let url = d.file_url;
      if (path) {
        const { data } = await supabase.storage
          .from("professional-docs")
          .createSignedUrl(path, 600);
        if (data?.signedUrl) url = data.signedUrl;
      }
      setPreviewDoc({ doc: d, url, kind: detectKind(d.file_name) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir el documento");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pro.avatar_url ?? undefined} />
              <AvatarFallback>
                {(pro.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {pro.profile?.full_name || "Sin nombre"}
          </DialogTitle>
          <DialogDescription>
            {pro.specialty || "—"} · {pro.home_city || "—"} · {pro.profile?.email}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4 py-2">
            {/* Status banner */}
            {pro.blocked && (
              <Card className="p-3 border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Perfil bloqueado</p>
                    <p className="text-muted-foreground">{pro.blocked_reason || "Sin motivo"}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <InfoTile icon={<Star className="h-4 w-4" />} label="Rating" value={pro.avg_rating ? Number(pro.avg_rating).toFixed(1) : "—"} />
              <InfoTile icon={<Briefcase className="h-4 w-4" />} label="Trabajos" value={String(pro.total_jobs ?? 0)} />
              <InfoTile icon={<CheckCircle2 className="h-4 w-4" />} label="Años exp." value={String(pro.years_experience ?? 0)} />
              <InfoTile icon={<FileCheck className="h-4 w-4" />} label="Trust" value={String(pro.social_trust_score ?? 0)} />
            </div>

            {/* Contact */}
            <Section title="Contacto">
              <p className="text-sm"><Mail className="inline h-3 w-3 mr-1" /> {pro.profile?.email || "—"}</p>
              <p className="text-sm"><Phone className="inline h-3 w-3 mr-1" /> {pro.profile?.phone || "—"}</p>
              <p className="text-sm"><MapPin className="inline h-3 w-3 mr-1" /> {pro.home_city || "—"}</p>
              {pro.rethus_number && (
                <p className="text-sm">RETHUS: <span className="font-mono">{pro.rethus_number}</span> {pro.rethus_verified && <Badge variant="outline" className="ml-1 text-xs">Verificado</Badge>}</p>
              )}
            </Section>

            {/* Bio + AI */}
            {pro.bio && (
              <Section title="Biografía">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pro.bio}</p>
              </Section>
            )}
            {pro.ai_summary && (
              <Section title="Resumen IA" icon={<Sparkles className="h-3 w-3" />}>
                <p className="text-sm text-muted-foreground">{pro.ai_summary}</p>
                {pro.ai_strengths && pro.ai_strengths.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pro.ai_strengths.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Experience */}
            {Array.isArray(pro.work_experience) && pro.work_experience.length > 0 && (
              <Section title="Experiencia laboral">
                <ul className="space-y-1 text-sm">
                  {(pro.work_experience as Array<Record<string, unknown>>).map((w, i) => (
                    <li key={i} className="text-muted-foreground">
                      • {String(w.role ?? "Rol")} — {String(w.company ?? "")} {w.years ? `(${String(w.years)})` : ""}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* References */}
            <Section title={`Referencias (${refs.length})`}>
              {refs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin referencias cargadas.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {refs.map((r) => (
                    <li key={r.id} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{r.full_name}</span> · {r.phone} · {r.relation || r.ref_type}
                      {r.verified && <Badge variant="outline" className="ml-1 text-xs">Verificada</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Documents */}
            <Section title={`Documentos (${docs.length})`} icon={<FileText className="h-3 w-3" />}>
              {docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                      <Badge variant="secondary" className="uppercase text-[10px]">{d.doc_type}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{d.file_name || "Sin nombre"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.status} · {new Date(d.created_at).toLocaleDateString("es-CO")}
                          {d.ai_score != null && ` · IA ${d.ai_score}/100`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => downloadDoc(d)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openPreview(d)} disabled={previewLoading}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteDoc(d)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Block reason editor */}
            <Section title="Motivo de bloqueo (si aplica)">
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ej: Tarjeta profesional vencida. Sube la tarjeta actualizada."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Visible para el profesional. Lo usará para corregir y reenviar.
              </p>
            </Section>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-wrap gap-2 justify-between sm:justify-between border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Eliminar perfil
          </Button>
          <div className="flex gap-2 flex-wrap">
            {pro.blocked ? (
              <Button variant="outline" size="sm" onClick={unblock} disabled={busy}>
                Desbloquear
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={block} disabled={busy}>
                <Ban className="h-4 w-4 mr-1" /> Bloquear
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={approve} disabled={busy}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar y publicar
            </Button>
          </div>
        </DialogFooter>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar perfil profesional?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrará el perfil profesional, documentos y referencias de{" "}
                <span className="font-medium">{pro.profile?.full_name}</span>. La cuenta de
                usuario quedará viva pero sin rol profesional. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={hardDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="font-semibold">{value}</p>
    </Card>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon} {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------- OFERTAS ------------------------------- */

function OffersTab({ reviewerId }: { reviewerId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "blocked">("all");
  const [selected, setSelected] = useState<Offer | null>(null);

  const load = async () => {
    setBusy(true);
    const { data: rows } = await supabase
      .from("job_offers")
      .select(
        "id, title, description, city, amount, modality, status, blocked, blocked_reason, posted_by, poster_type, contact_phone, start_date, end_date, requirements, created_at",
      )
      .eq("poster_type", "family")
      .order("created_at", { ascending: false })
      .limit(500);

    const posterIds = Array.from(new Set((rows ?? []).map((r) => r.posted_by)));
    let posters: Array<{ user_id: string; full_name: string | null; email: string | null }> = [];
    if (posterIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", posterIds);
      posters = ps ?? [];
    }
    const byId = new Map(posters.map((p) => [p.user_id, p]));
    const merged = (rows ?? []).map((r) => ({ ...r, poster: byId.get(r.posted_by) })) as Offer[];
    merged.sort((a, b) =>
      (a.poster?.full_name || "").localeCompare(b.poster?.full_name || "", "es", { sensitivity: "base" }),
    );
    setOffers(merged);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return offers.filter((o) => {
      if (filter === "open" && (o.blocked || o.status !== "open")) return false;
      if (filter === "blocked" && !o.blocked) return false;
      if (!needle) return true;
      return (
        o.title.toLowerCase().includes(needle) ||
        o.poster?.full_name?.toLowerCase().includes(needle) ||
        o.city.toLowerCase().includes(needle)
      );
    });
  }, [offers, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar por familia, título, ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {(["all", "open", "blocked"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : f === "open" ? "Abiertas" : "Bloqueadas"}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} oferta{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No hay ofertas que coincidan.
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((o) => (
            <Card
              key={o.id}
              className="p-4 flex items-center gap-3 hover:bg-muted/30 cursor-pointer"
              onClick={() => setSelected(o)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{o.title}</p>
                  {o.blocked && (
                    <Badge variant="destructive" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" /> Bloqueada
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{o.status}</Badge>
                  <Badge variant="secondary" className="text-xs">{o.modality}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Publicada por <span className="font-medium text-foreground">{o.poster?.full_name || "—"}</span> · {o.city} · ${o.amount.toLocaleString("es-CO")}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" /> Revisar
              </Button>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <OfferDetailDialog
          offer={selected}
          reviewerId={reviewerId}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function OfferDetailDialog({
  offer,
  reviewerId,
  onClose,
  onChanged,
}: {
  offer: Offer;
  reviewerId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [blockReason, setBlockReason] = useState(offer.blocked_reason ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const approve = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("job_offers")
      .update({
        blocked: false,
        blocked_reason: null,
        blocked_at: null,
        blocked_by: null,
        status: "open",
      })
      .eq("id", offer.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Oferta aprobada");
    onChanged();
    onClose();
  };

  const block = async () => {
    if (!blockReason.trim()) {
      toast.error("Escribe el motivo del bloqueo");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("job_offers")
      .update({
        blocked: true,
        blocked_reason: blockReason.trim(),
        blocked_at: new Date().toISOString(),
        blocked_by: reviewerId,
        status: "closed",
      })
      .eq("id", offer.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Oferta bloqueada");
    onChanged();
    onClose();
  };

  const unblock = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("job_offers")
      .update({ blocked: false, blocked_reason: null, blocked_at: null, blocked_by: null, status: "open" })
      .eq("id", offer.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bloqueo retirado");
    onChanged();
    onClose();
  };

  const hardDelete = async () => {
    setBusy(true);
    const { error } = await supabase.from("job_offers").delete().eq("id", offer.id);
    setBusy(false);
    setConfirmDelete(false);
    if (error) return toast.error(error.message);
    toast.success("Oferta eliminada");
    onChanged();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{offer.title}</DialogTitle>
          <DialogDescription>
            Publicada por {offer.poster?.full_name || "—"} ({offer.poster?.email || "sin email"})
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3 py-2">
            {offer.blocked && (
              <Card className="p-3 border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive flex items-center gap-1 text-sm">
                  <Ban className="h-4 w-4" /> Oferta bloqueada
                </p>
                <p className="text-sm text-muted-foreground mt-1">{offer.blocked_reason || "Sin motivo"}</p>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <InfoTile icon={<MapPin className="h-4 w-4" />} label="Ciudad" value={offer.city} />
              <InfoTile icon={<Briefcase className="h-4 w-4" />} label="Modalidad" value={offer.modality} />
              <InfoTile icon={<Star className="h-4 w-4" />} label="Monto" value={`$${offer.amount.toLocaleString("es-CO")}`} />
              <InfoTile icon={<CheckCircle2 className="h-4 w-4" />} label="Estado" value={offer.status} />
            </div>

            {offer.description && (
              <Section title="Descripción">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.description}</p>
              </Section>
            )}

            {offer.requirements && offer.requirements.length > 0 && (
              <Section title="Requisitos">
                <div className="flex flex-wrap gap-1">
                  {offer.requirements.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {(offer.start_date || offer.end_date) && (
              <Section title="Fechas">
                <p className="text-sm text-muted-foreground">
                  {offer.start_date ? new Date(offer.start_date).toLocaleDateString("es-CO") : "—"}
                  {" → "}
                  {offer.end_date ? new Date(offer.end_date).toLocaleDateString("es-CO") : "—"}
                </p>
              </Section>
            )}

            {offer.contact_phone && (
              <Section title="Teléfono contacto">
                <p className="text-sm"><Phone className="inline h-3 w-3 mr-1" />{offer.contact_phone}</p>
              </Section>
            )}

            <Section title="Motivo de bloqueo (si aplica)">
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ej: Falta describir el tipo de cuidado requerido."
                rows={3}
              />
            </Section>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-wrap gap-2 justify-between border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} disabled={busy}>
            <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Eliminar oferta
          </Button>
          <div className="flex gap-2">
            {offer.blocked ? (
              <Button variant="outline" size="sm" onClick={unblock} disabled={busy}>
                Desbloquear
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={block} disabled={busy}>
                <Ban className="h-4 w-4 mr-1" /> Bloquear
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={approve} disabled={busy}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
            </Button>
          </div>
        </DialogFooter>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar oferta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se perderán las aplicaciones asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={hardDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- DOCUMENTOS ----------------------------- */

function DocsTab({ reviewerId }: { reviewerId: string }) {
  const [docs, setDocs] = useState<(Doc & { profile?: { full_name: string | null; email: string | null } })[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase
      .from("professional_documents")
      .select("id, doc_type, file_name, file_url, user_id, status, created_at, ai_score, ai_notes")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const ids = (data ?? []).map((d) => d.user_id);
    let profs: Array<{ user_id: string; full_name: string | null; email: string | null }> = [];
    if (ids.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ids);
      profs = ps ?? [];
    }
    const byId = new Map(profs.map((p) => [p.user_id, p]));
    setDocs((data ?? []).map((d) => ({ ...d, profile: byId.get(d.user_id) })) as typeof docs);
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (doc: Doc, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("professional_documents")
      .update({
        status,
        reviewer_note: notes[doc.id] || null,
        reviewed_by: reviewerId,
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
    toast.success(status === "approved" ? "Aprobado" : "Rechazado");
    load();
  };

  const aiValidate = async (doc: Doc) => {
    toast.loading("Validando con IA…", { id: `ai-${doc.id}` });
    const { data, error } = await supabase.functions.invoke("document-verifier", {
      body: { document_id: doc.id },
    });
    toast.dismiss(`ai-${doc.id}`);
    if (error) return toast.error(error.message);
    toast.success(`IA: ${data?.score ?? "?"}/100 — ${data?.recommendation ?? "validado"}`);
    load();
  };

  return (
    <div className="grid gap-4 max-w-4xl">
      {busy && <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />}
      {!busy && docs.length === 0 && (
        <Card className="p-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-biosensor mx-auto mb-3" />
          <p className="font-semibold">¡Bandeja vacía!</p>
          <p className="text-sm text-muted-foreground mt-1">No hay documentos pendientes.</p>
        </Card>
      )}
      {docs.map((d) => (
        <Card key={d.id} className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <Badge variant="secondary" className="mb-2 uppercase tracking-wider">{d.doc_type}</Badge>
              <p className="text-sm font-medium">{d.profile?.full_name || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">{d.file_name || "Sin nombre de archivo"}</p>
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
  );
}
