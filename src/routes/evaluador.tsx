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
  Award,
  ShieldCheck,
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
  head: () => ({
    meta: [{ title: "Evaluador · Humanix" }, { name: "robots", content: "noindex,nofollow" }],
  }),
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
  { label: "Marketplace", to: "/superadmin/marketplace", icon: Briefcase },
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

type DocAI = {
  ai_score: number | null;
  ai_notes: string | null;
  ai_verified: boolean | null;
  ai_extracted: unknown;
};

type HolisticValidation = {
  is_publishable: boolean;
  score: number;
  critical_errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  ai_summary: string;
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
        <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto">
          <TabsTrigger
            value="profesionales"
            className="flex-col sm:flex-row gap-1 py-2 text-[11px] sm:text-sm"
          >
            <Users className="h-4 w-4 sm:mr-1" />
            <span>Profesionales</span>
          </TabsTrigger>
          <TabsTrigger
            value="ofertas"
            className="flex-col sm:flex-row gap-1 py-2 text-[11px] sm:text-sm"
          >
            <Briefcase className="h-4 w-4 sm:mr-1" />
            <span className="sm:hidden">Ofertas</span>
            <span className="hidden sm:inline">Ofertas familias</span>
          </TabsTrigger>
          <TabsTrigger
            value="documentos"
            className="flex-col sm:flex-row gap-1 py-2 text-[11px] sm:text-sm"
          >
            <FileCheck className="h-4 w-4 sm:mr-1" />
            <span className="sm:hidden">Docs</span>
            <span className="hidden sm:inline">Documentos pendientes</span>
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
    let profiles: Array<{
      user_id: string;
      full_name: string | null;
      email: string | null;
      phone: string | null;
    }> = [];
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
        <Input
          placeholder="Buscar nombre, email, ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 sm:pb-0 sm:overflow-visible">
          {(["all", "pending", "published", "blocked"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="shrink-0"
            >
              {f === "all"
                ? "Todos"
                : f === "pending"
                  ? "Pendientes"
                  : f === "published"
                    ? "Publicados"
                    : "Bloqueados"}
            </Button>
          ))}
        </div>
        <span className="sm:ml-auto text-xs sm:text-sm text-muted-foreground">
          {filtered.length} profesional{filtered.length === 1 ? "" : "es"}
        </span>
      </div>

      {busy ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No hay profesionales que coincidan.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card
              key={p.user_id}
              className="group p-4 flex flex-col gap-3 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5 cursor-pointer transition-all border-border"
              onClick={() => setSelected(p)}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0 rounded-xl">
                  <AvatarImage src={p.avatar_url ?? undefined} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-biosensor/10 text-biosensor font-semibold">
                    {(p.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm leading-tight">
                    {p.profile?.full_name || "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {p.specialty || "Sin especialidad"}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {p.blocked && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        <Ban className="h-2.5 w-2.5 mr-0.5" /> Bloqueado
                      </Badge>
                    )}
                    {p.published && !p.blocked && (
                      <Badge className="bg-biosensor/20 text-biosensor border-biosensor/30 text-[10px] px-1.5 py-0 h-4">
                        Publicado
                      </Badge>
                    )}
                    {!p.published && !p.blocked && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        Pendiente
                      </Badge>
                    )}
                    {p.rethus_verified && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-biosensor" /> RETHUS
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Rating
                  </p>
                  <p className="text-sm font-semibold">
                    {p.avg_rating ? Number(p.avg_rating).toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Turnos
                  </p>
                  <p className="text-sm font-semibold">{p.total_jobs ?? 0}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Trust
                  </p>
                  <p
                    className={`text-sm font-semibold ${(p.social_trust_score ?? 0) >= 70 ? "text-biosensor" : ""}`}
                  >
                    {p.social_trust_score ?? 0}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.home_city || "Sin ciudad"}
                </span>
                {p.hourly_rate && (
                  <span className="font-semibold text-foreground shrink-0">
                    ${p.hourly_rate.toLocaleString("es-CO")}/h
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-auto group-hover:bg-foreground group-hover:text-background transition-colors"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" /> Revisar perfil completo
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
  const [refs, setRefs] = useState<
    Array<{
      id: string;
      full_name: string;
      phone: string;
      relation: string | null;
      ref_type: string;
      verified: boolean;
    }>
  >([]);
  const [blockReason, setBlockReason] = useState(pro.blocked_reason ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    doc: Doc;
    url: string;
    kind: "pdf" | "image" | "office" | "other";
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [docExtras, setDocExtras] = useState<Record<string, DocAI>>({});
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [holistic, setHolistic] = useState<HolisticValidation | null>(null);
  const [holisticBusy, setHolisticBusy] = useState(false);

  const loadAll = async () => {
    const [docsRes, refsRes] = await Promise.all([
      supabase
        .from("professional_documents")
        .select(
          "id, doc_type, file_name, file_url, user_id, status, created_at, ai_score, ai_notes, ai_verified, ai_extracted",
        )
        .eq("user_id", pro.user_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("professional_references")
        .select("id, full_name, phone, relation, ref_type, verified")
        .eq("user_id", pro.user_id),
    ]);
    const rows = (docsRes.data ?? []) as Array<Doc & DocAI>;
    setDocs(rows.map(({ ai_verified: _v, ai_extracted: _e, ...d }) => d as Doc));
    const extras: Record<string, DocAI> = {};
    rows.forEach((r) => {
      extras[r.id] = {
        ai_score: r.ai_score,
        ai_notes: r.ai_notes,
        ai_verified: r.ai_verified,
        ai_extracted: r.ai_extracted,
      };
    });
    setDocExtras(extras);
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
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", pro.user_id)
      .eq("role", "professional");
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
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "odt", "ods"].includes(ext))
      return "office";
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

  const analyzeDoc = async (d: Doc) => {
    setAnalyzingDoc(d.id);
    try {
      // Generate signed URL the edge function can fetch
      const path = getStoragePath(d.file_url);
      let signedUrl = d.file_url;
      if (path) {
        const { data } = await supabase.storage
          .from("professional-docs")
          .createSignedUrl(path, 600);
        if (data?.signedUrl) signedUrl = data.signedUrl;
      }
      const ext = (d.file_name ?? "").toLowerCase().split(".").pop() ?? "";
      const mime =
        ext === "pdf"
          ? "application/pdf"
          : ["jpg", "jpeg"].includes(ext)
            ? "image/jpeg"
            : ext === "png"
              ? "image/png"
              : ext === "webp"
                ? "image/webp"
                : "application/pdf";

      const { data, error } = await supabase.functions.invoke("document-verifier", {
        body: { file_url: signedUrl, mime_type: mime, doc_type: d.doc_type },
      });
      if (error) throw error;
      const v = data?.verification;
      if (!v) throw new Error("Sin respuesta de la IA");

      const score = Math.round(Number(v.confidence ?? 0));
      const newStatus = v.is_valid ? "approved" : "rejected";
      const notes = [v.reason, v.issues?.length ? `Problemas: ${v.issues.join("; ")}` : null]
        .filter(Boolean)
        .join(" ");

      await supabase
        .from("professional_documents")
        .update({
          ai_score: score,
          ai_notes: notes,
          ai_verified: !!v.is_valid,
          ai_extracted: v.extracted ?? null,
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        })
        .eq("id", d.id);

      toast.success(
        `IA: ${v.is_valid ? "documento válido" : "documento rechazado"} (${score}/100)`,
      );
      setExpandedDoc(d.id);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error analizando documento");
    } finally {
      setAnalyzingDoc(null);
    }
  };

  const runHolisticAnalysis = async () => {
    setHolisticBusy(true);
    setHolistic(null);
    try {
      const profilePayload = {
        full_name: pro.profile?.full_name,
        email: pro.profile?.email,
        phone: pro.profile?.phone,
        city: pro.home_city,
        specialty: pro.specialty,
        years_experience: pro.years_experience,
        rethus_number: pro.rethus_number,
        bio: pro.bio,
        certifications: pro.certifications,
        work_experience: pro.work_experience,
        languages: pro.languages,
        service_cities: pro.service_cities,
      };
      const documentsPayload = docs.map((d) => ({
        doc_type: d.doc_type,
        status: d.status,
        ai_verified: docExtras[d.id]?.ai_verified ?? null,
        ai_score: d.ai_score,
        ai_notes: d.ai_notes,
        ai_extracted: docExtras[d.id]?.ai_extracted ?? null,
      }));
      const referencesPayload = refs.map((r) => ({
        ref_type: r.ref_type,
        full_name: r.full_name,
        phone: r.phone,
        relation: r.relation,
      }));

      const { data, error } = await supabase.functions.invoke("profile-holistic-validator", {
        body: {
          profile: profilePayload,
          documents: documentsPayload,
          references: referencesPayload,
        },
      });
      if (error) throw error;
      const v = data?.validation as HolisticValidation | undefined;
      if (!v) throw new Error("Sin respuesta");
      setHolistic(v);
      toast.success(`Análisis completo · score ${v.score}/100`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en análisis");
    } finally {
      setHolisticBusy(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] sm:w-full max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6 gap-3">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-start gap-3">
              <Avatar className="h-14 w-14 shrink-0 rounded-2xl ring-2 ring-border">
                <AvatarImage src={pro.avatar_url ?? undefined} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-biosensor/10 text-biosensor font-bold text-lg">
                  {(pro.profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="truncate font-display text-lg">
                    {pro.profile?.full_name || "Sin nombre"}
                  </span>
                  {pro.verified && <CheckCircle2 className="h-4 w-4 text-biosensor shrink-0" />}
                  {pro.blocked && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                      Bloqueado
                    </Badge>
                  )}
                  {pro.published && !pro.blocked && (
                    <Badge className="bg-biosensor/20 text-biosensor border-biosensor/30 text-[10px] px-1.5 py-0 h-5">
                      Publicado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-sm font-normal text-muted-foreground">
                    {pro.specialty || "Sin especialidad"}
                  </span>
                  {pro.home_city && (
                    <span className="text-xs text-muted-foreground/60">· {pro.home_city}</span>
                  )}
                  {pro.rethus_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-biosensor/15 text-biosensor border border-biosensor/30">
                      <ShieldCheck className="h-3 w-3" /> RETHUS
                      {pro.rethus_number ? ` ${pro.rethus_number}` : ""}
                    </span>
                  )}
                </div>
                {pro.profile?.email && (
                  <a
                    href={`mailto:${pro.profile.email}`}
                    className="text-xs text-muted-foreground hover:text-foreground truncate mt-0.5 block transition-colors"
                  >
                    {pro.profile.email}
                  </a>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-4 py-1">
              {/* Status banner */}
              {pro.blocked && (
                <Card className="p-3 border-destructive/30 bg-destructive/5 flex items-start gap-2">
                  <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Perfil bloqueado</p>
                    <p className="text-muted-foreground">{pro.blocked_reason || "Sin motivo"}</p>
                  </div>
                </Card>
              )}

              {/* ── Fila 1: KPIs + Contacto ─────────────────────────────────── */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* KPIs */}
                <Card className="p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-copper" /> Métricas de desempeño
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-copper/8 border border-copper/20 p-3 text-center">
                      <Star className="h-3.5 w-3.5 text-copper mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Rating
                      </p>
                      <p className="text-xl font-bold text-copper">
                        {pro.avg_rating ? Number(pro.avg_rating).toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-fuchsia-neural/8 border border-fuchsia-neural/20 p-3 text-center">
                      <Briefcase className="h-3.5 w-3.5 text-fuchsia-neural mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Trabajos
                      </p>
                      <p className="text-xl font-bold text-fuchsia-neural">{pro.total_jobs ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                      <Award className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Años exp.
                      </p>
                      <p className="text-xl font-bold">{pro.years_experience ?? 0}</p>
                    </div>
                    <div
                      className={`rounded-xl border p-3 text-center ${
                        (pro.social_trust_score ?? 0) >= 70
                          ? "bg-biosensor/8 border-biosensor/20"
                          : (pro.social_trust_score ?? 0) > 0
                            ? "bg-copper/8 border-copper/20"
                            : "bg-muted/40 border-border"
                      }`}
                    >
                      <ShieldCheck
                        className={`h-3.5 w-3.5 mx-auto mb-1 ${
                          (pro.social_trust_score ?? 0) >= 70
                            ? "text-biosensor"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Trust
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          (pro.social_trust_score ?? 0) >= 70
                            ? "text-biosensor"
                            : (pro.social_trust_score ?? 0) > 0
                              ? "text-copper"
                              : ""
                        }`}
                      >
                        {pro.social_trust_score ?? 0}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Contacto */}
                <Card className="p-4 space-y-3">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-biosensor" /> Contacto e identidad
                  </p>
                  <div className="space-y-2">
                    <a
                      href={pro.profile?.email ? `mailto:${pro.profile.email}` : undefined}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted/60 transition-colors group"
                    >
                      <Mail className="h-3.5 w-3.5 text-biosensor shrink-0" />
                      <span className="text-sm truncate group-hover:text-foreground text-muted-foreground">
                        {pro.profile?.email || "—"}
                      </span>
                    </a>
                    <a
                      href={pro.profile?.phone ? `tel:${pro.profile.phone}` : undefined}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted/60 transition-colors group"
                    >
                      <Phone className="h-3.5 w-3.5 text-biosensor shrink-0" />
                      <span className="text-sm group-hover:text-foreground text-muted-foreground">
                        {pro.profile?.phone || "—"}
                      </span>
                    </a>
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-muted/30">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{pro.home_city || "—"}</span>
                    </div>
                    {pro.rethus_number && (
                      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-biosensor/8 border border-biosensor/20">
                        <FileCheck className="h-3.5 w-3.5 text-biosensor shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-biosensor/70">
                            RETHUS
                          </p>
                          <p className="font-mono text-sm font-semibold text-biosensor">
                            {pro.rethus_number}
                          </p>
                        </div>
                        {pro.rethus_verified ? (
                          <Badge className="bg-biosensor/20 text-biosensor text-[10px] shrink-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            Sin verificar
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* ── Fila 2: Tarifas + Especialidades ────────────────────────── */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-fuchsia-neural" /> Tarifas declaradas
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Por hora", value: pro.hourly_rate },
                      { label: "Por turno", value: null },
                      { label: "Mensual", value: null },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-muted/40 p-2 text-center">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                        <p className="text-xs font-semibold mt-0.5">
                          {value ? `$${value.toLocaleString("es-CO")}` : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-biosensor" /> Habilidades y cobertura
                  </p>
                  {pro.languages && pro.languages.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Idiomas</p>
                      <div className="flex flex-wrap gap-1">
                        {pro.languages.map((l, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {pro.service_cities && pro.service_cities.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Ciudades de servicio</p>
                      <div className="flex flex-wrap gap-1">
                        {pro.service_cities.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" />
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(pro.certifications) &&
                    (pro.certifications as unknown[]).length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Certificaciones</p>
                        <div className="flex flex-wrap gap-1">
                          {(pro.certifications as string[]).map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </Card>
              </div>

              {/* ── Fila 3: Bio + Experiencia ────────────────────────────────── */}
              <div className="grid sm:grid-cols-2 gap-4">
                {(pro.bio || pro.ai_summary) && (
                  <Card className="p-4 space-y-3">
                    {pro.bio && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                          Biografía
                        </p>
                        <div className="border-l-2 border-biosensor/40 pl-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">{pro.bio}</p>
                        </div>
                      </div>
                    )}
                    {pro.ai_summary && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-fuchsia-neural" /> Resumen IA
                        </p>
                        <div className="border-l-2 border-fuchsia-neural/40 pl-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {pro.ai_summary}
                          </p>
                        </div>
                        {pro.ai_strengths && pro.ai_strengths.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pro.ai_strengths.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                <Card className="p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Referencias ({refs.length})
                  </p>
                  {refs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin referencias cargadas.</p>
                  ) : (
                    <div className="space-y-2">
                      {refs.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg bg-muted/30 px-3 py-2 text-sm flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.phone} · {r.relation || r.ref_type}
                            </p>
                          </div>
                          {r.verified && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-biosensor" />
                              Verif.
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* ── Experiencia laboral ──────────────────────────────────────── */}
              {Array.isArray(pro.work_experience) && pro.work_experience.length > 0 && (
                <Card className="p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                    Experiencia laboral
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(pro.work_experience as Array<Record<string, unknown>>).map((w, i) => (
                      <div key={i} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                        <p className="font-medium">{String(w.role ?? "Rol")}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(w.company ?? "")} {w.years ? `· ${String(w.years)} años` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ── Documentos en grid ──────────────────────────────────────── */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-fuchsia-neural" /> Documentos (
                    {docs.length})
                  </p>
                  <span className="text-[10px] text-muted-foreground">Ver · IA · Descargar</span>
                </div>
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docs.map((d) => {
                      const extra = docExtras[d.id];
                      const extracted = extra?.ai_extracted as
                        | Record<string, unknown>
                        | null
                        | undefined;
                      const isExpanded = expandedDoc === d.id;
                      const aiOk = extra?.ai_verified === true;
                      const aiBad = extra?.ai_verified === false;
                      return (
                        <div
                          key={d.id}
                          className={`rounded-xl border flex flex-col overflow-hidden ${aiOk ? "border-biosensor/30" : aiBad ? "border-destructive/30" : "border-border"}`}
                        >
                          {/* Doc type header */}
                          <div
                            className={`px-3 py-2 flex items-center justify-between gap-2 ${aiOk ? "bg-biosensor/5" : aiBad ? "bg-destructive/5" : "bg-muted/30"}`}
                          >
                            <Badge variant="secondary" className="uppercase text-[10px]">
                              {d.doc_type}
                            </Badge>
                            {aiOk && (
                              <Badge className="bg-biosensor/20 text-biosensor text-[10px] h-4 px-1.5">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Veraz
                              </Badge>
                            )}
                            {aiBad && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                <XCircle className="h-2.5 w-2.5 mr-0.5" />
                                Sospechoso
                              </Badge>
                            )}
                          </div>
                          {/* Doc name + score */}
                          <div className="px-3 py-2 flex-1">
                            <p
                              className="text-xs font-medium truncate"
                              title={d.file_name || "Sin nombre"}
                            >
                              {d.file_name || "Sin nombre"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                              <span className="capitalize">{d.status}</span>
                              <span>·</span>
                              <span>{new Date(d.created_at).toLocaleDateString("es-CO")}</span>
                              {d.ai_score != null && (
                                <span
                                  className={`font-semibold ${d.ai_score >= 70 ? "text-biosensor" : "text-destructive"}`}
                                >
                                  · IA {d.ai_score}/100
                                </span>
                              )}
                            </p>
                          </div>
                          {/* Actions */}
                          <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(d)}
                              disabled={previewLoading}
                              className="h-7 text-[10px]"
                            >
                              <Eye className="h-3 w-3 mr-0.5" /> Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadDoc(d)}
                              className="h-7 text-[10px]"
                            >
                              <Download className="h-3 w-3 mr-0.5" /> Bajar
                            </Button>
                            <Button
                              size="sm"
                              variant={analyzingDoc === d.id ? "secondary" : "outline"}
                              onClick={() => analyzeDoc(d)}
                              disabled={analyzingDoc === d.id}
                              className="h-7 text-[10px]"
                            >
                              {analyzingDoc === d.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3 mr-0.5" />
                                  IA
                                </>
                              )}
                            </Button>
                          </div>
                          {/* Expand AI results */}
                          {(extra?.ai_notes ||
                            (extracted && Object.keys(extracted).length > 0)) && (
                            <button
                              onClick={() => setExpandedDoc(isExpanded ? null : d.id)}
                              className="text-[10px] text-muted-foreground hover:text-foreground px-3 pb-2 text-left underline underline-offset-2"
                            >
                              {isExpanded ? "Ocultar análisis IA" : "Ver análisis IA"}
                            </button>
                          )}
                          {isExpanded && (
                            <div className="border-t mx-2 mb-2 px-2 pt-2 bg-muted/10 rounded-b-lg space-y-1.5 text-xs max-h-36 overflow-y-auto">
                              {extra?.ai_notes && (
                                <div>
                                  <p className="font-semibold uppercase text-[9px] text-muted-foreground mb-0.5">
                                    Veredicto IA
                                  </p>
                                  <p className="text-muted-foreground">{extra.ai_notes}</p>
                                </div>
                              )}
                              {extracted && Object.keys(extracted).length > 0 && (
                                <div>
                                  <p className="font-semibold uppercase text-[9px] text-muted-foreground mb-0.5">
                                    Datos extraídos
                                  </p>
                                  {Object.entries(extracted).map(([k, v]) => (
                                    <p key={k} className="text-muted-foreground">
                                      <span className="font-medium text-foreground">{k}:</span>{" "}
                                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* ── Análisis IA holístico ────────────────────────────────────── */}
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-fuchsia-neural" /> Validación integral IA
                  </p>
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={runHolisticAnalysis}
                    disabled={holisticBusy || docs.length === 0}
                  >
                    {holisticBusy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Analizando…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Validar perfil completo
                      </>
                    )}
                  </Button>
                </div>
                {holistic && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {holistic.is_publishable ? (
                        <Badge className="bg-biosensor/20 text-biosensor">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Publicable
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          No publicable
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${holistic.score >= 70 ? "bg-biosensor" : holistic.score >= 50 ? "bg-copper" : "bg-destructive"}`}
                            style={{ width: `${holistic.score}%` }}
                          />
                        </div>
                        <span
                          className={`font-semibold text-sm ${holistic.score >= 70 ? "text-biosensor" : "text-destructive"}`}
                        >
                          {holistic.score}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{holistic.ai_summary}</p>
                    {holistic.critical_errors.length > 0 && (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <p className="text-xs font-semibold text-destructive uppercase mb-1.5">
                          Errores críticos ({holistic.critical_errors.length})
                        </p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {holistic.critical_errors.map((e, i) => (
                            <div key={i} className="text-xs bg-background/60 rounded px-2 py-1.5">
                              <span className="font-medium text-destructive">{e.field}:</span>{" "}
                              <span className="text-muted-foreground">{e.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {holistic.warnings.length > 0 && (
                      <div className="rounded-lg border border-muted bg-muted/30 p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                          Advertencias ({holistic.warnings.length})
                        </p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {holistic.warnings.map((w, i) => (
                            <div key={i} className="text-xs bg-background/60 rounded px-2 py-1.5">
                              <span className="font-medium">{w.field}:</span>{" "}
                              <span className="text-muted-foreground">{w.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* ── Motivo de bloqueo ────────────────────────────────────────── */}
              <Card className="p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Ban className="h-3.5 w-3.5 text-destructive" /> Motivo de bloqueo (si aplica)
                </p>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej: Tarjeta profesional vencida. Sube la tarjeta actualizada."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Visible para el profesional al iniciar sesión.
                </p>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Eliminar perfil
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {pro.blocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unblock}
                  disabled={busy}
                  className="flex-1 sm:flex-initial"
                >
                  Desbloquear
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={block}
                  disabled={busy}
                  className="flex-1 sm:flex-initial"
                >
                  <Ban className="h-4 w-4 mr-1" /> Bloquear
                </Button>
              )}
              <Button
                variant="hero"
                size="sm"
                onClick={approve}
                disabled={busy}
                className="flex-1 sm:flex-initial"
              >
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
      {previewDoc ? (
        <Dialog open onOpenChange={(o) => !o && setPreviewDoc(null)}>
          <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <DialogTitle className="text-base flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {previewDoc.doc.file_name || previewDoc.doc.doc_type}
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase ml-1">
                  {previewDoc.doc.doc_type}
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-xs">
                <span>{previewDoc.doc.status}</span>
                <span>·</span>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir en pestaña nueva
                </a>
                <span>·</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => downloadDoc(previewDoc.doc)}
                >
                  <Download className="h-3 w-3" /> Descargar
                </button>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 bg-muted/30 overflow-auto">
              {previewDoc.kind === "pdf" ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.doc.file_name ?? "Documento"}
                  className="w-full h-full border-0"
                />
              ) : previewDoc.kind === "image" ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.doc.file_name ?? "Documento"}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                </div>
              ) : previewDoc.kind === "office" ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.url)}&embedded=true`}
                  title={previewDoc.doc.file_name ?? "Documento Office"}
                  className="w-full h-full border-0 bg-white"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Este formato no se puede previsualizar. Descárgalo para verlo.
                  </p>
                  <Button size="sm" onClick={() => downloadDoc(previewDoc.doc)}>
                    <Download className="h-4 w-4 mr-1" /> Descargar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="font-semibold">{value}</p>
    </Card>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
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
      (a.poster?.full_name || "").localeCompare(b.poster?.full_name || "", "es", {
        sensitivity: "base",
      }),
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <Card
              key={o.id}
              className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col ${o.blocked ? "border-destructive/30" : ""}`}
              onClick={() => setSelected(o)}
            >
              <div
                className={`px-4 pt-4 pb-2 flex items-start justify-between gap-2 ${o.blocked ? "bg-destructive/5" : "bg-muted/10"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{o.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {o.city} · {o.modality}
                  </p>
                </div>
                {o.blocked ? (
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    <Ban className="h-2.5 w-2.5 mr-0.5" />
                    Bloqueada
                  </Badge>
                ) : (
                  <Badge
                    variant={o.status === "open" ? "outline" : "secondary"}
                    className="text-[10px] shrink-0 capitalize"
                  >
                    {o.status}
                  </Badge>
                )}
              </div>
              <div className="px-4 py-3 flex-1 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/40 p-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Tarifa
                    </p>
                    <p className="text-sm font-bold">${o.amount.toLocaleString("es-CO")}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Tipo
                    </p>
                    <p className="text-sm font-bold capitalize">{o.poster_type}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {o.description || "Sin descripción."}
                </p>
              </div>
              <div className="px-3 pb-3">
                <p className="text-[10px] text-muted-foreground mb-2 truncate">
                  Familia:{" "}
                  <span className="font-medium text-foreground">{o.poster?.full_name || "—"}</span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Revisar oferta
                </Button>
              </div>
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
                <p className="text-sm text-muted-foreground mt-1">
                  {offer.blocked_reason || "Sin motivo"}
                </p>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <InfoTile icon={<MapPin className="h-4 w-4" />} label="Ciudad" value={offer.city} />
              <InfoTile
                icon={<Briefcase className="h-4 w-4" />}
                label="Modalidad"
                value={offer.modality}
              />
              <InfoTile
                icon={<Star className="h-4 w-4" />}
                label="Monto"
                value={`$${offer.amount.toLocaleString("es-CO")}`}
              />
              <InfoTile
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Estado"
                value={offer.status}
              />
            </div>

            {offer.description && (
              <Section title="Descripción">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {offer.description}
                </p>
              </Section>
            )}

            {offer.requirements && offer.requirements.length > 0 && (
              <Section title="Requisitos">
                <div className="flex flex-wrap gap-1">
                  {offer.requirements.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {r}
                    </Badge>
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
                <p className="text-sm">
                  <Phone className="inline h-3 w-3 mr-1" />
                  {offer.contact_phone}
                </p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
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
  const [docs, setDocs] = useState<
    (Doc & { profile?: { full_name: string | null; email: string | null } })[]
  >([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {docs.length > 0
            ? `${docs.length} documento${docs.length === 1 ? "" : "s"} pendiente${docs.length === 1 ? "" : "s"} de revisión`
            : ""}
        </p>
        <Button size="sm" variant="outline" onClick={load} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Actualizar"}
        </Button>
      </div>

      {busy && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card animate-pulse">
              <div className="h-10 bg-muted rounded-t-xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded mt-3" />
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <div className="h-7 bg-muted rounded" />
                  <div className="h-7 bg-muted rounded" />
                  <div className="h-7 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!busy && docs.length === 0 && (
        <Card className="p-14 text-center">
          <CheckCircle2 className="h-10 w-10 text-biosensor mx-auto mb-3" />
          <p className="font-semibold text-lg">¡Bandeja vacía!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay documentos pendientes de revisión.
          </p>
        </Card>
      )}

      {!busy && docs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border flex flex-col overflow-hidden ${d.ai_score != null && d.ai_score < 60 ? "border-destructive/30" : "border-border"}`}
            >
              {/* Header */}
              <div
                className={`px-3 py-2.5 flex items-center justify-between gap-2 ${d.ai_score != null && d.ai_score < 60 ? "bg-destructive/5" : "bg-muted/20"}`}
              >
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                  {d.doc_type}
                </Badge>
                {d.ai_score != null && (
                  <span
                    className={`text-[10px] font-bold ${d.ai_score >= 70 ? "text-biosensor" : "text-destructive"}`}
                  >
                    IA {d.ai_score}/100
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="px-3 py-2.5 flex-1 space-y-0.5">
                <p className="text-sm font-semibold truncate">
                  {d.profile?.full_name || "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={d.file_name || ""}>
                  {d.file_name || "Sin nombre de archivo"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(d.created_at).toLocaleString("es-CO", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                {d.ai_notes && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 italic">
                    {d.ai_notes}
                  </p>
                )}
              </div>

              {/* Nota */}
              <div className="px-3 pb-1.5">
                <Textarea
                  placeholder="Nota para el profesional…"
                  value={notes[d.id] || ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                <Button
                  size="sm"
                  variant="hero"
                  onClick={() => review(d, "approved")}
                  className="h-7 text-[10px]"
                >
                  <CheckCircle2 className="h-3 w-3 mr-0.5" /> Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(d, "rejected")}
                  className="h-7 text-[10px]"
                >
                  <XCircle className="h-3 w-3 mr-0.5" /> Rechazar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => aiValidate(d)}
                  className="h-7 text-[10px] col-span-1"
                >
                  <Sparkles className="h-3 w-3 mr-0.5" /> Validar IA
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
                  <a href={d.file_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-0.5" /> Abrir
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
