import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppUser } from "@/hooks/use-app-user";
import {
  Loader2,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  Star,
  Briefcase,
  MapPin,
  Wand2,
  Send,
  LogOut,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/humanix/Logo";
import { HumanixAssistant } from "@/components/humanix/HumanixAssistant";
import { AvatarUploader } from "@/components/humanix/AvatarUploader";
import { DocumentsManager } from "@/components/humanix/DocumentsManager";
import { AvailabilityCalendar } from "@/components/humanix/AvailabilityCalendar";
import { MatchingOffers } from "@/components/humanix/MatchingOffers";
import { OnboardingTour } from "@/components/humanix/OnboardingTour";
import { AiFingerprintCard } from "@/components/humanix/AiFingerprintCard";
import { SemanticOffers } from "@/components/humanix/SemanticOffers";
import { LocationPicker } from "@/components/humanix/LocationPicker";
import { ReferencesManager } from "@/components/humanix/ReferencesManager";
import { MercadoPagoSubscription } from "@/components/humanix/MercadoPagoSubscription";
import { NotificationsBell } from "@/components/humanix/NotificationsBell";
import { PublishGate } from "@/components/humanix/PublishGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/dashboard/profesional")({
  head: () => ({
    meta: [{ title: "Mi panel profesional · Humanix" }],
  }),
  component: ProDashboard,
});

type WorkExp = {
  role: string;
  employer: string;
  city?: string;
  start?: string;
  end?: string;
  description?: string;
};

type ProProfile = {
  user_id: string;
  specialty: string | null;
  sub_specialties: string[] | null;
  years_experience: number | null;
  rethus_number: string | null;
  rethus_verified: boolean | null;
  hourly_rate: number | null;
  shift_rate: number | null;
  monthly_rate: number | null;
  service_cities: string[] | null;
  languages: string[] | null;
  certifications: unknown;
  trust_score: number | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_suggestions: string[] | null;
  ai_preapproved: boolean | null;
  verified: boolean | null;
  active: boolean | null;
  total_jobs: number | null;
  avg_rating: number | null;
  avatar_url: string | null;
  bio: string | null;
  work_experience: WorkExp[] | null;
  lat: number | null;
  lng: number | null;
  home_city: string | null;
  published: boolean | null;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  modality: "hour" | "shift" | "month" | "package";
  amount: number;
  city: string;
  specialty_required: string | null;
  shifts_count: number | null;
  status: "open" | "closed" | "filled";
  created_at: string;
  posted_by: string;
};

type AppRow = {
  id: string;
  job_offer_id: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
};

const COP = (n: number | null | undefined) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

function ProDashboard() {
  const { user, loading: authLoading, logout: appLogout } = useAppUser({
    allow: ["professional", "superadmin"],
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [showTour, setShowTour] = useState(false);

  // Onboarding IA
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // Form fields
  const [specialty, setSpecialty] = useState("");
  const [years, setYears] = useState<number | "">("");
  const [rethus, setRethus] = useState("");
  const [hourly, setHourly] = useState<number | "">("");
  const [shift, setShift] = useState<number | "">("");
  const [monthly, setMonthly] = useState<number | "">("");
  const [cities, setCities] = useState("");
  const [subs, setSubs] = useState("");
  const [certs, setCerts] = useState("");
  const [bio, setBio] = useState("");
  const [workExp, setWorkExp] = useState<WorkExp[]>([]);

  const trust = profile?.trust_score ?? 0;
  const greetingName = useMemo(
    () => fullName.split(" ")[0] || "profesional",
    [fullName],
  );

  const loadAll = async (uid: string) => {
    try {
      const [p, pr, off, ap] = await Promise.all([
        supabase.from("professional_profiles").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("user_id", uid).maybeSingle(),
        supabase
          .from("job_offers")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("applications")
          .select("id, job_offer_id, status, created_at")
          .eq("professional_id", uid)
          .order("created_at", { ascending: false }),
      ]);
      if (pr.data?.full_name) setFullName(pr.data.full_name);
      if (off.data) setOffers(off.data as Offer[]);
      if (ap.data) setApps(ap.data as AppRow[]);
      if (p.data) {
        const pp = p.data as unknown as ProProfile;
        setProfile(pp);
        setSpecialty(pp.specialty ?? "");
        setYears(pp.years_experience ?? "");
        setRethus(pp.rethus_number ?? "");
        setHourly(pp.hourly_rate ?? "");
        setShift(pp.shift_rate ?? "");
        setMonthly(pp.monthly_rate ?? "");
        setCities((pp.service_cities ?? []).join(", "));
        setSubs((pp.sub_specialties ?? []).join(", "));
        setCerts(
          Array.isArray(pp.certifications)
            ? (pp.certifications as string[]).join(", ")
            : "",
        );
        setBio(pp.bio ?? "");
        setWorkExp(Array.isArray(pp.work_experience) ? pp.work_experience : []);
      } else {
        // Best-effort create. Don't block the UI if RLS rejects it.
        const ins = await supabase.from("professional_profiles").insert({ user_id: uid });
        if (ins.error) {
          // eslint-disable-next-line no-console
          console.warn("[pro dashboard] could not create empty profile:", ins.error.message);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[pro dashboard] loadAll failed:", err);
      toast.error("No pudimos cargar todos tus datos. Intenta refrescar.");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return; // useAppUser handles redirects
    let active = true;
    const uid = user.id;
    setUserId(uid);
    setFullName(user.fullName);
    (async () => {
      try {
        await loadAll(uid);
      } finally {
        if (active) setLoading(false);
      }
      try {
        const seen = localStorage.getItem(`hx_tour_${uid}`);
        if (!seen && active) setShowTour(true);
      } catch {
        // ignore
      }
    })();
    // Hard safety net: never stay loading forever.
    const safety = setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);
    return () => {
      active = false;
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const closeTour = () => {
    setShowTour(false);
    if (userId) {
      try {
        localStorage.setItem(`hx_tour_${userId}`, "1");
      } catch {
        // ignore
      }
    }
  };

  const applyExtraction = (p: Record<string, unknown>) => {
    if (typeof p.specialty === "string") setSpecialty(p.specialty);
    if (typeof p.years_experience === "number") setYears(p.years_experience);
    if (typeof p.rethus_number === "string") setRethus(p.rethus_number);
    if (typeof p.hourly_rate === "number") setHourly(p.hourly_rate);
    if (typeof p.shift_rate === "number") setShift(p.shift_rate);
    if (typeof p.monthly_rate === "number") setMonthly(p.monthly_rate);
    if (Array.isArray(p.service_cities)) setCities((p.service_cities as string[]).join(", "));
    if (Array.isArray(p.sub_specialties)) setSubs((p.sub_specialties as string[]).join(", "));
    if (Array.isArray(p.certifications)) setCerts((p.certifications as string[]).join(", "));
    if (typeof p.bio === "string" && !bio) setBio(p.bio);
    if (Array.isArray(p.work_experience)) setWorkExp(p.work_experience as WorkExp[]);
    if (typeof p.full_name === "string" && !fullName) setFullName(p.full_name);
  };

  const extractFromText = async () => {
    const text = aiText.trim();
    if (!text) {
      toast.error("Cuéntame primero sobre tu experiencia");
      return;
    }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-extractor", {
        body: { text },
      });
      if (error) throw error;
      applyExtraction(data?.profile ?? {});
      toast.success("✨ Listo. Revisa los campos antes de guardar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error procesando con IA");
    } finally {
      setAiBusy(false);
    }
  };

  const buildPayload = () => ({
    specialty: specialty || null,
    years_experience: years === "" ? null : Number(years),
    rethus_number: rethus || null,
    hourly_rate: hourly === "" ? null : Number(hourly),
    shift_rate: shift === "" ? null : Number(shift),
    monthly_rate: monthly === "" ? null : Number(monthly),
    service_cities: cities.split(",").map((s) => s.trim()).filter(Boolean),
    sub_specialties: subs.split(",").map((s) => s.trim()).filter(Boolean),
    certifications: certs.split(",").map((s) => s.trim()).filter(Boolean),
    bio: bio || null,
    work_experience: workExp,
  });

  const saveProfile = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("professional_profiles")
      .update(buildPayload())
      .eq("user_id", userId)
      .select()
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setProfile(data as unknown as ProProfile);
    toast.success("Perfil guardado");
  };

  const validateWithAI = async () => {
    if (!userId) return;
    setValidating(true);
    try {
      const payload = buildPayload();
      const { data, error } = await supabase.functions.invoke("profile-validator", {
        body: { profile: { ...payload, rethus_verified: profile?.rethus_verified ?? false } },
      });
      if (error) throw error;
      const ev = data?.evaluation ?? {};
      const score = typeof ev.trust_score === "number" ? Math.round(ev.trust_score) : 0;
      const upd = await supabase
        .from("professional_profiles")
        .update({
          ai_summary: ev.ai_summary ?? null,
          ai_strengths: ev.ai_strengths ?? [],
          ai_suggestions: ev.ai_suggestions ?? [],
          trust_score: score,
          ai_preapproved: score >= 70,
        })
        .eq("user_id", userId)
        .select()
        .maybeSingle();
      if (upd.data) setProfile(upd.data as unknown as ProProfile);
      if (score >= 70) {
        toast.success("✨ Pre-aprobado por IA. Nuestro equipo confirmará pronto.");
      } else {
        toast.success("Trust Score actualizado");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en validación IA");
    } finally {
      setValidating(false);
    }
  };

  const suggestRatesAndBio = async () => {
    if (!userId) return;
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("rate-suggester", {
        body: { profile: buildPayload() },
      });
      if (error) throw error;
      const s = data?.suggestion ?? {};
      if (typeof s.hourly_rate === "number") setHourly(s.hourly_rate);
      if (typeof s.shift_rate === "number") setShift(s.shift_rate);
      if (typeof s.monthly_rate === "number") setMonthly(s.monthly_rate);
      if (typeof s.bio === "string") setBio(s.bio);
      toast.success("✨ Sugerencias aplicadas. Revisa antes de guardar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error sugiriendo tarifas");
    } finally {
      setSuggesting(false);
    }
  };

  const apply = async (offerId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("applications").insert({
      job_offer_id: offerId,
      professional_id: userId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Reservar la oferta y al profesional por 15 días (status azul "Tomado").
    const { error: rpcErr } = await supabase.rpc("set_offer_reserved", {
      _offer_id: offerId,
      _professional_id: userId,
    });
    if (rpcErr) {
      console.warn("[reserve]", rpcErr.message);
    }
    toast.success("✓ Aplicación enviada · oferta reservada 15 días");
    const [{ data: appsData }, { data: offersData }] = await Promise.all([
      supabase
        .from("applications")
        .select("id, job_offer_id, status, created_at")
        .eq("professional_id", userId),
      supabase
        .from("job_offers")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (appsData) setApps(appsData as AppRow[]);
    if (offersData) setOffers(offersData as Offer[]);
  };

  const logout = async () => {
    await appLogout();
  };

  const appliedIds = new Set(apps.map((a) => a.job_offer_id));

  const addExp = () =>
    setWorkExp((prev) => [...prev, { role: "", employer: "", city: "", start: "", end: "" }]);
  const updateExp = (i: number, k: keyof WorkExp, v: string) =>
    setWorkExp((prev) => prev.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const removeExp = (i: number) =>
    setWorkExp((prev) => prev.filter((_, idx) => idx !== i));

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando tu panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-aurora">
      {showTour && <OnboardingTour onClose={closeTour} />}

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-biosensor/10 text-biosensor border border-biosensor/30">
              <Stethoscope className="h-3 w-3" /> Profesional
            </span>
            {profile?.ai_preapproved && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-fuchsia-neural/10 text-fuchsia-neural border border-fuchsia-neural/30">
                <Sparkles className="h-3 w-3" /> Pre-aprobado IA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {userId && <NotificationsBell userId={userId} />}
            <Link to="/mensajes" className="text-sm text-muted-foreground hover:text-foreground px-3 hidden sm:inline">
              Mensajes
            </Link>
            <Link to="/planes" className="text-sm text-muted-foreground hover:text-foreground px-3 hidden sm:inline">
              Planes
            </Link>
            <Link to="/buscar" className="text-sm text-muted-foreground hover:text-foreground px-3 hidden sm:inline">
              Marketplace
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1.5" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome + Trust card */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/95 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-biosensor font-semibold">
              Bienvenida/o, {greetingName}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold">
              Tu carrera en salud, sin fricción.
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Construye tu perfil con ayuda de IA, sube tus documentos, recibe ofertas que encajan y mejora tu Trust Score.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Stat icon={<Briefcase className="h-4 w-4" />} label="Turnos" value={String(profile?.total_jobs ?? 0)} />
              <Stat icon={<Star className="h-4 w-4" />} label="Rating" value={(profile?.avg_rating ?? 0).toFixed(1)} />
              <Stat
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Estado"
                value={
                  profile?.verified ? "Verificado" : profile?.ai_preapproved ? "Pre-aprobado" : "En revisión"
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/95 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Trust Score</p>
              <TrendingUp className="h-4 w-4 text-biosensor" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gradient-bio">{trust}</span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-biosensor to-fuchsia-neural transition-all"
                style={{ width: `${Math.min(100, trust)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              ≥70 = pre-aprobado IA · staff confirma final.
            </p>
            <Button
              variant="glass"
              size="sm"
              className="mt-3 w-full"
              onClick={validateWithAI}
              disabled={validating}
            >
              {validating ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              Re-evaluar con IA
            </Button>
          </div>
        </section>

        {/* Identidad */}
        {userId && (
          <section className="rounded-2xl border border-border bg-card/95 p-6">
            <h2 className="font-semibold mb-4">Identidad</h2>
            <AvatarUploader
              userId={userId}
              initialUrl={profile?.avatar_url ?? null}
              onChange={(url) =>
                setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev))
              }
            />
          </section>
        )}

        {/* IA onboarding */}
        <section className="rounded-2xl border border-border bg-card/95 p-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-fuchsia-neural" />
            <h2 className="font-semibold">Llena tu perfil con IA</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cuéntame en una frase tu experiencia y completo los campos por ti. O sube tu hoja de vida abajo y la leo automáticamente.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={2}
              placeholder='Ej: "Soy enfermera, 7 años en cuidado adulto mayor, RETHUS 12345, atiendo Bogotá y Soacha, tengo BLS vigente."'
              className="flex-1"
            />
            <Button onClick={extractFromText} disabled={aiBusy} variant="hero">
              {aiBusy ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Extraer
            </Button>
          </div>
        </section>

        {/* Documentos */}
        {userId && (
          <section className="rounded-2xl border border-border bg-card/95 p-6">
            <h2 className="font-semibold mb-1">Documentos</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sube tu hoja de vida (PDF) y la IA extrae tus datos. Los demás documentos los revisa nuestro equipo.
            </p>
            <DocumentsManager userId={userId} onCvExtracted={applyExtraction} />
          </section>
        )}

        {/* Profile form */}
        <section className="rounded-2xl border border-border bg-card/95 p-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-semibold">Datos de tu perfil profesional</h2>
            <Button
              size="sm"
              variant="glass"
              onClick={suggestRatesAndBio}
              disabled={suggesting || !specialty}
              title={!specialty ? "Llena la especialidad primero" : undefined}
            >
              {suggesting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              )}
              Sugerir tarifas y bio con IA
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Especialidad principal">
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Cuidado adulto mayor" />
            </Field>
            <Field label="Años de experiencia">
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Número RETHUS">
              <Input value={rethus} onChange={(e) => setRethus(e.target.value)} />
            </Field>
            <Field label="Ciudades de servicio (separadas por coma)">
              <Input value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Bogotá, Soacha" />
            </Field>
            <Field label="Sub-especialidades">
              <Input value={subs} onChange={(e) => setSubs(e.target.value)} placeholder="Heridas, EPOC" />
            </Field>
            <Field label="Certificaciones">
              <Input value={certs} onChange={(e) => setCerts(e.target.value)} placeholder="BLS, ACLS" />
            </Field>
            <Field label="Tarifa por hora (COP)">
              <Input
                type="number"
                value={hourly}
                onChange={(e) => setHourly(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Tarifa por turno (COP)">
              <Input
                type="number"
                value={shift}
                onChange={(e) => setShift(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Tarifa mensual (COP)">
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </Field>
            <Field label="Bio profesional (la ven familias e IPS)">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Cuéntale al mundo quién eres en 2-3 frases."
              />
            </Field>
          </div>

          {/* Experiencia laboral */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Experiencia laboral</h3>
              <Button size="sm" variant="ghost" onClick={addExp}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
              </Button>
            </div>
            {workExp.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin experiencia agregada. Sube tu CV y la IA la llena por ti.
              </p>
            ) : (
              <ul className="space-y-3">
                {workExp.map((e, i) => (
                  <li key={i} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeExp(i)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar experiencia"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Cargo"
                        value={e.role}
                        onChange={(ev) => updateExp(i, "role", ev.target.value)}
                      />
                      <Input
                        placeholder="Empresa / IPS"
                        value={e.employer}
                        onChange={(ev) => updateExp(i, "employer", ev.target.value)}
                      />
                      <Input
                        placeholder="Ciudad"
                        value={e.city ?? ""}
                        onChange={(ev) => updateExp(i, "city", ev.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Inicio (2020)"
                          value={e.start ?? ""}
                          onChange={(ev) => updateExp(i, "start", ev.target.value)}
                        />
                        <Input
                          placeholder="Fin (Actual)"
                          value={e.end ?? ""}
                          onChange={(ev) => updateExp(i, "end", ev.target.value)}
                        />
                      </div>
                    </div>
                    <Textarea
                      className="mt-2"
                      rows={2}
                      placeholder="Logros y responsabilidades"
                      value={e.description ?? ""}
                      onChange={(ev) => updateExp(i, "description", ev.target.value)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} variant="hero">
              Guardar perfil
            </Button>
          </div>

          {/* AI feedback */}
          {(profile?.ai_summary || (profile?.ai_strengths?.length ?? 0) > 0) && (
            <div className="mt-6 grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Resumen IA
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{profile?.ai_summary ?? ""}</ReactMarkdown>
                </div>
                {!!profile?.ai_strengths?.length && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {profile.ai_strengths.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Sugerencias para subir tu Trust Score
                </p>
                <ul className="space-y-1.5 text-sm">
                  {(profile?.ai_suggestions ?? []).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <Sparkles className="h-4 w-4 text-fuchsia-neural mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Huella IA */}
        {userId && <AiFingerprintCard userId={userId} />}

        {/* Match semántico (vector) */}
        <section className="rounded-2xl border border-border bg-card/95 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-neural" />
              <h2 className="font-semibold">Matches semánticos (huella IA)</h2>
            </div>
            <Link to="/buscar" search={{ tab: "ofertas" }} className="text-sm text-biosensor hover:underline">
              Ver todas →
            </Link>
          </div>
          {userId && (
            <SemanticOffers userId={userId} appliedIds={appliedIds} onApply={apply} />
          )}
        </section>

        {/* Agenda virtual */}
        {userId && (
          <section className="rounded-2xl border border-border bg-card/95 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Tu agenda virtual</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Marca las horas en que estás disponible. Las familias e instituciones lo verán al buscarte.
                </p>
              </div>
            </div>
            <AvailabilityCalendar userId={userId} />
          </section>
        )}

        {/* Match IA (heurístico contextual) */}
        <section className="rounded-2xl border border-border bg-card/95 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-biosensor" />
              <h2 className="font-semibold">Ofertas que encajan contigo</h2>
            </div>
            <Link to="/buscar" search={{ tab: "ofertas" }} className="text-sm text-biosensor hover:underline">
              Ver todas →
            </Link>
          </div>
          <MatchingOffers
            profile={profile as unknown as Record<string, unknown> | null}
            offers={offers}
            appliedIds={appliedIds}
            onApply={apply}
          />
        </section>

        {/* Offers */}
        <section className="rounded-2xl border border-border bg-card/95 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Todas las ofertas activas</h2>
            <Link to="/buscar" search={{ tab: "ofertas" }} className="text-sm text-biosensor hover:underline">
              Ver todas →
            </Link>
          </div>
          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ofertas activas en este momento.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {offers.map((o) => {
                const applied = appliedIds.has(o.id);
                return (
                  <article key={o.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{o.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {o.city}
                          {o.specialty_required && ` · ${o.specialty_required}`}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {labelModality(o.modality)}
                      </span>
                    </div>
                    {o.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{o.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">{COP(o.amount)}</p>
                      <Button
                        size="sm"
                        variant={applied ? "glass" : "hero"}
                        disabled={applied}
                        onClick={() => apply(o.id)}
                      >
                        {applied ? "Aplicada" : "Aplicar"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <HumanixAssistant
        persona="professional"
        greeting={`¡Hola ${greetingName}! Soy tu coach IA. Pídeme: preparar entrevista, mejorar mi perfil, resumir un historial clínico, o explicar trámites RETHUS.`}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon} {label}
      </div>
      <p className="mt-1 font-semibold text-base">{value}</p>
    </div>
  );
}

function labelModality(m: Offer["modality"]) {
  return m === "hour" ? "Por hora" : m === "shift" ? "Por turno" : m === "month" ? "Mensual" : "Paquete";
}
