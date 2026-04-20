import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Loader2, Megaphone, LayoutDashboard, ShieldAlert, ScrollText, MessageSquare,
  Users, FileCheck, Briefcase, Plus, Sparkles, Eye, Trash2, Pencil, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { AppShell, type NavItem } from "@/components/humanix/AppShell";
import { useAppUser } from "@/hooks/use-app-user";
import { ShareButtons } from "@/components/humanix/ShareButtons";
import { PromoCards } from "@/components/humanix/PromoCards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/publicidad")({
  head: () => ({ meta: [{ title: "Publicidad · Superadmin" }] }),
  component: PublicidadPage,
});

const NAV: NavItem[] = [
  { label: "Overview", to: "/superadmin", icon: LayoutDashboard },
  { label: "Anti-fraude", to: "/superadmin/fraude", icon: ShieldAlert },
  { label: "Auditoría", to: "/superadmin/auditoria", icon: ScrollText },
  { label: "Marketplace", to: "/superadmin/marketplace", icon: Briefcase },
  { label: "Publicidad", to: "/superadmin/publicidad", icon: Megaphone },
  { label: "CRM", to: "/superadmin/crm", icon: MessageSquare },
  { label: "Talento Humano", to: "/talento-humano", icon: Users },
  { label: "Evaluador", to: "/evaluador", icon: FileCheck },
];

type Banner = {
  id: string; title: string; description: string | null; cta_label: string | null;
  link_url: string | null; image_url: string | null; audience: string; position: string;
  active: boolean; ai_recommendation: string | null; ai_score: number | null;
  impressions: number; clicks: number; shares_count: number;
  starts_at: string | null; ends_at: string | null; created_at: string;
};

const EMPTY: Partial<Banner> = {
  title: "", description: "", cta_label: "Ver más", link_url: "",
  image_url: "", audience: "all", position: "home_hero", active: true,
};

function PublicidadPage() {
  const { user, loading, logout } = useAppUser({ allow: ["superadmin"] });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const origin = typeof window !== "undefined" ? window.location.origin : "https://humanix.co";

  useEffect(() => {
    if (!user) return;
    void load();
    const ch = supabase
      .channel("ads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_banners" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  const load = async () => {
    const { data } = await supabase.from("ad_banners")
      .select("*").order("created_at", { ascending: false });
    setBanners((data ?? []) as Banner[]);
  };

  const save = async () => {
    if (!editing?.title) {
      toast.error("Título requerido");
      return;
    }
    const payload = {
      title: editing.title!,
      description: editing.description ?? null,
      cta_label: editing.cta_label ?? null,
      link_url: editing.link_url ?? null,
      image_url: editing.image_url ?? null,
      audience: editing.audience ?? "all",
      position: editing.position ?? "home_hero",
      active: editing.active ?? true,
      ai_recommendation: editing.ai_recommendation ?? null,
      ai_score: editing.ai_score ?? null,
      starts_at: editing.starts_at ?? null,
      ends_at: editing.ends_at ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("ad_banners").update(payload).eq("id", editing.id)
      : await supabase.from("ad_banners").insert({ ...payload, created_by: user?.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing.id ? "Banner actualizado" : "Banner creado");
    await supabase.rpc("log_audit", {
      _action: editing.id ? "ad.update" : "ad.create",
      _resource_type: "ad_banners",
      _resource_id: editing.id ?? undefined,
      _severity: "info",
      _meta: { title: editing.title } as never,
    });
    setOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar banner?")) return;
    await supabase.from("ad_banners").delete().eq("id", id);
    await supabase.rpc("log_audit", {
      _action: "ad.delete", _resource_type: "ad_banners", _resource_id: id, _severity: "warn",
    });
    toast.success("Eliminado");
    await load();
  };

  const recommend = async () => {
    if (!editing) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ad-recommender", {
        body: {
          title: editing.title, description: editing.description,
          cta_label: editing.cta_label, target_intent: editing.audience,
        },
      });
      if (error) throw error;
      const rec = data as {
        title_suggestion: string; description_suggestion: string; cta_suggestion: string;
        audience: string; ai_score: number; recommendation: string;
      };
      setEditing({
        ...editing,
        title: rec.title_suggestion,
        description: rec.description_suggestion,
        cta_label: rec.cta_suggestion,
        audience: rec.audience,
        ai_score: rec.ai_score,
        ai_recommendation: rec.recommendation,
      });
      toast.success("IA aplicada al banner");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error IA");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const activeBanners = banners.filter((b) => b.active);
  const carouselItems = selectedIds.size > 0 ? banners.filter((b) => selectedIds.has(b.id)) : activeBanners;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  const current = carouselItems[carouselIdx % Math.max(1, carouselItems.length)];

  return (
    <AppShell
      user={user} onLogout={logout} nav={NAV}
      title="Publicidad"
      subtitle="CRUD de banners con IA de copy, carrusel y publicación a redes."
      crumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Publicidad" }]}
      badge={{ label: "Publicidad", tone: "copper" }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-muted-foreground">
            {banners.length} banner{banners.length === 1 ? "" : "s"} · {activeBanners.length} activo{activeBanners.length === 1 ? "" : "s"}
            {selectedIds.size > 0 && ` · ${selectedIds.size} seleccionado(s)`}
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => setEditing(EMPTY)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Nuevo banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Editar banner" : "Nuevo banner"}</DialogTitle>
                <DialogDescription>Diseña el copy y deja que la IA lo optimice.</DialogDescription>
              </DialogHeader>
              {editing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Audiencia</Label>
                      <Select value={editing.audience ?? "all"} onValueChange={(v) => setEditing({ ...editing, audience: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="family">Familias</SelectItem>
                          <SelectItem value="professional">Profesionales</SelectItem>
                          <SelectItem value="institution">Instituciones</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Posición</Label>
                      <Select value={editing.position ?? "home_hero"} onValueChange={(v) => setEditing({ ...editing, position: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home_hero">Home · Hero</SelectItem>
                          <SelectItem value="home_carousel">Home · Carrusel</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="search">Búsqueda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CTA</Label>
                      <Input value={editing.cta_label ?? ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} />
                    </div>
                    <div>
                      <Label>URL destino</Label>
                      <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://…" />
                    </div>
                  </div>
                  <div>
                    <Label>URL imagen</Label>
                    <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                      <Label>Activo</Label>
                    </div>
                    <Button type="button" variant="outline" onClick={recommend} disabled={aiLoading} className="gap-1.5">
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-biosensor" />}
                      Optimizar con IA
                    </Button>
                  </div>
                  {editing.ai_recommendation && (
                    <div className="rounded-lg border border-biosensor/30 bg-biosensor/5 p-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <Sparkles className="h-3 w-3 text-biosensor" />
                        IA Score: {editing.ai_score ?? "—"}/100
                      </div>
                      <p className="text-foreground/80">{editing.ai_recommendation}</p>
                    </div>
                  )}
                  {editing.image_url && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img src={editing.image_url} alt="Preview" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={save}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 border-fuchsia-neural/30 bg-gradient-to-br from-fuchsia-neural/5 via-background to-biosensor/5 shadow-[var(--shadow-glow-fuchsia)]">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-fuchsia-neural/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-fuchsia-neural" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base">Marketing en redes sociales</h2>
                <p className="text-xs text-muted-foreground">8 plantillas listas para promocionar Humanix en Facebook, WhatsApp, LinkedIn y X.</p>
              </div>
            </div>
            <Badge className="bg-fuchsia-neural text-fuchsia-neural-foreground text-[10px]">NUEVO</Badge>
          </div>
          <PromoCards origin={origin} />
        </Card>

        {carouselItems.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-copper" /> Vista previa carrusel
              </h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCarouselIdx((i) => (i - 1 + carouselItems.length) % carouselItems.length)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {(carouselIdx % carouselItems.length) + 1}/{carouselItems.length}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setCarouselIdx((i) => (i + 1) % carouselItems.length)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {current && (
              <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-br from-copper/10 to-biosensor/10 p-6">
                {current.image_url && (
                  <img src={current.image_url} alt={current.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                )}
                <h3 className="font-display text-xl font-bold">{current.title}</h3>
                {current.description && <p className="text-sm text-foreground/80 mt-2">{current.description}</p>}
                {current.cta_label && (
                  <Button variant="hero" size="sm" className="mt-4" asChild>
                    <a href={current.link_url ?? "#"} target="_blank" rel="noreferrer">{current.cta_label}</a>
                  </Button>
                )}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-muted-foreground">
                    {current.impressions} impresiones · {current.clicks} clicks · {current.shares_count} shares
                  </div>
                  <ShareButtons
                    url={current.link_url ?? `${origin}/?banner=${current.id}`}
                    title={current.title}
                    description={current.description ?? ""}
                    onShare={async () => {
                      await supabase.from("ad_banners").update({ shares_count: current.shares_count + 1 }).eq("id", current.id);
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="space-y-2">
          {banners.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Aún no hay banners.</Card>
          ) : (
            banners.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    className="mt-1.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{b.title}</h3>
                      <Badge variant={b.active ? "default" : "secondary"} className="text-[10px]">
                        {b.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{b.audience}</Badge>
                      <Badge variant="outline" className="text-[10px]">{b.position}</Badge>
                      {b.ai_score !== null && (
                        <Badge className="bg-biosensor text-biosensor-foreground text-[10px] gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> {b.ai_score}/100
                        </Badge>
                      )}
                    </div>
                    {b.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {b.impressions} imp · {b.clicks} clk · {b.shares_count} shares
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-fuchsia-neural" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
