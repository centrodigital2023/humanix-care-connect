// Onboarding inteligente para familias: foto, cédula, dirección, contacto de
// emergencia y Habeas Data. UX en pasos, responsive y guiado.
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Camera,
  IdCard,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAppUser } from "@/hooks/use-app-user";
import { Logo } from "@/components/humanix/Logo";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/familia/onboarding")({
  head: () => ({
    meta: [{ title: "Completa tu perfil familiar · Humanix" }],
  }),
  component: FamilyOnboarding,
});

const schema = z.object({
  fullName: z.string().trim().min(3, "Nombre obligatorio").max(120),
  idNumber: z.string().trim().min(5, "Cédula obligatoria").max(20),
  phone: z.string().trim().min(7, "Teléfono obligatorio").max(20),
  city: z.string().trim().min(2, "Ciudad obligatoria").max(80),
  defaultAddress: z.string().trim().min(5, "Dirección obligatoria").max(200),
  emergencyName: z.string().trim().min(3, "Contacto de emergencia obligatorio").max(120),
  emergencyPhone: z.string().trim().min(7, "Teléfono de emergencia obligatorio").max(20),
  patientName: z.string().trim().max(120).optional(),
  patientRelation: z.string().trim().max(60).optional(),
  patientAge: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || v === "" ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined,
    ),
});

const STEPS = [
  { key: "identity", label: "Identidad", icon: IdCard },
  { key: "address", label: "Dirección", icon: MapPin },
  { key: "emergency", label: "Emergencia", icon: Phone },
  { key: "consent", label: "Consentimiento", icon: ShieldCheck },
] as const;

function FamilyOnboarding() {
  const { user, loading } = useAppUser({ allow: ["family", "superadmin"] });
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [habeasOk, setHabeasOk] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    idNumber: "",
    phone: "",
    city: "",
    defaultAddress: "",
    emergencyName: "",
    emergencyPhone: "",
    patientName: "",
    patientRelation: "",
    patientAge: "",
  });

  // Pre-cargar datos existentes
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: prof }, { data: fam }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, city, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("family_profiles")
          .select(
            "id_number, default_address, emergency_contact_name, emergency_contact_phone, patient_name, patient_relation, patient_age, habeas_data_accepted",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      setAvatarUrl(prof?.avatar_url ?? null);
      setHabeasOk(!!fam?.habeas_data_accepted);
      setForm((f) => ({
        ...f,
        fullName: prof?.full_name ?? user.fullName ?? "",
        phone: prof?.phone ?? "",
        city: prof?.city ?? "",
        idNumber: fam?.id_number ?? "",
        defaultAddress: fam?.default_address ?? "",
        emergencyName: fam?.emergency_contact_name ?? "",
        emergencyPhone: fam?.emergency_contact_phone ?? "",
        patientName: fam?.patient_name ?? "",
        patientRelation: fam?.patient_relation ?? "",
        patientAge: fam?.patient_age != null ? String(fam.patient_age) : "",
      }));
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const set = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 5MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
      await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", user.id);
      toast.success("Foto actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setAvatarUploading(false);
    }
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (form.fullName.trim().length < 3) return "Ingresa tu nombre completo";
      if (form.idNumber.trim().length < 5) return "Ingresa tu número de cédula";
      if (form.phone.trim().length < 7) return "Ingresa un teléfono válido";
    }
    if (s === 1) {
      if (form.city.trim().length < 2) return "Ingresa tu ciudad";
      if (form.defaultAddress.trim().length < 5) return "Ingresa tu dirección";
    }
    if (s === 2) {
      if (form.emergencyName.trim().length < 3) return "Nombre de contacto de emergencia";
      if (form.emergencyPhone.trim().length < 7) return "Teléfono de emergencia";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user) return;
    if (!habeasOk) {
      toast.error("Debes aceptar el tratamiento de datos personales (Ley 1581).");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los campos");
      return;
    }
    setSaving(true);
    try {
      const v = parsed.data;
      // 1) profiles
      await supabase.from("profiles").update({
        full_name: v.fullName,
        phone: v.phone,
        city: v.city,
      }).eq("user_id", user.id);
      // 2) family_profiles (upsert)
      const { error: famErr } = await supabase.from("family_profiles").upsert(
        {
          user_id: user.id,
          id_number: v.idNumber,
          default_address: v.defaultAddress,
          emergency_contact_name: v.emergencyName,
          emergency_contact_phone: v.emergencyPhone,
          patient_name: v.patientName || null,
          patient_relation: v.patientRelation || null,
          patient_age: v.patientAge ?? null,
          habeas_data_accepted: true,
          habeas_data_accepted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (famErr) throw famErr;
      // 3) Registro de consentimiento
      await supabase.from("user_consents").insert({
        user_id: user.id,
        consent_type: "habeas_data_ley_1581",
        granted: true,
        user_agent: navigator.userAgent,
      });
      toast.success("¡Perfil completo! Ya puedes contratar profesionales.");
      navigate({ to: "/buscar", search: { tab: "profesionales" } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  const Step = STEPS[step];

  return (
    <div className="min-h-screen bg-background bg-aurora">
      <header className="mx-auto max-w-3xl px-4 sm:px-6 py-6 flex items-center justify-between">
        <Logo />
        <Link to="/dashboard/familia" className="text-xs text-muted-foreground hover:text-foreground">
          Saltar por ahora
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3 py-1 text-[11px] font-semibold text-copper uppercase tracking-wider">
            <HeartHandshake className="h-3 w-3" /> Bienvenida a Humanix
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight">
            Completa tu perfil familiar
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Necesitamos algunos datos para conectarte con cuidadores verificados de forma segura.
            Esto toma menos de 2 minutos.
          </p>
        </div>

        {/* Stepper */}
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={s.key}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition ${
                  active
                    ? "border-biosensor bg-biosensor/10 text-biosensor"
                    : done
                      ? "border-biosensor/40 bg-biosensor/5 text-biosensor"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </li>
            );
          })}
        </ol>

        <Card className="mt-6 p-6 sm:p-8">
          {/* Foto siempre visible arriba */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Tu foto"
                  className="h-20 w-20 rounded-2xl object-cover border border-border"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-biosensor/10 text-biosensor flex items-center justify-center font-display text-2xl font-bold">
                  {form.fullName ? form.fullName.charAt(0).toUpperCase() : "F"}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-copper text-copper-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition">
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                  }}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{form.fullName || "Tu nombre"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Foto opcional pero recomendada — genera confianza con el cuidador.
              </p>
            </div>
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Sobre ti</h2>
              <Field label="Nombre completo" required>
                <Input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="María García López"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Cédula de ciudadanía" required>
                  <Input
                    inputMode="numeric"
                    value={form.idNumber}
                    onChange={(e) => set("idNumber", e.target.value)}
                    placeholder="1.020.345.678"
                  />
                </Field>
                <Field label="Teléfono / WhatsApp" required>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="3001234567"
                  />
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tus datos viajan cifrados y nunca se comparten con el cuidador hasta que
                aceptes una contratación.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">¿Dónde será el servicio?</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Ciudad" required>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Bogotá"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Dirección habitual" required>
                    <Input
                      value={form.defaultAddress}
                      onChange={(e) => set("defaultAddress", e.target.value)}
                      placeholder="Cra 15 # 100-25, Apto 502"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 mt-4">
                <p className="text-sm font-semibold">¿Para quién es el cuidado? <span className="text-muted-foreground font-normal">(opcional)</span></p>
                <div className="mt-3 grid sm:grid-cols-3 gap-3">
                  <Field label="Nombre del paciente">
                    <Input
                      value={form.patientName}
                      onChange={(e) => set("patientName", e.target.value)}
                      placeholder="Pedro García"
                    />
                  </Field>
                  <Field label="Parentesco">
                    <Input
                      value={form.patientRelation}
                      onChange={(e) => set("patientRelation", e.target.value)}
                      placeholder="Padre"
                    />
                  </Field>
                  <Field label="Edad">
                    <Input
                      inputMode="numeric"
                      value={form.patientAge}
                      onChange={(e) => set("patientAge", e.target.value)}
                      placeholder="78"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Contacto de emergencia</h2>
              <p className="text-sm text-muted-foreground">
                Persona a quien notificaremos si activas el botón de pánico durante un servicio.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nombre completo" required>
                  <Input
                    value={form.emergencyName}
                    onChange={(e) => set("emergencyName", e.target.value)}
                    placeholder="Juan García"
                  />
                </Field>
                <Field label="Teléfono" required>
                  <Input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => set("emergencyPhone", e.target.value)}
                    placeholder="3009876543"
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-fuchsia-neural/30 bg-fuchsia-neural/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-fuchsia-neural">Botón de pánico 24/7:</strong> en caso de emergencia,
                Humanix notifica al contacto, comparte la ubicación en vivo y conecta con la línea 123.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Consentimiento y privacidad</h2>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed max-h-56 overflow-auto">
                <p className="font-semibold text-foreground mb-2">Tratamiento de datos personales — Ley 1581 de 2012</p>
                <p>
                  En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013, Humanix
                  S.A.S. te informa que recolectará y tratará tus datos personales (incluida la información
                  del paciente, dirección y contactos) con la finalidad exclusiva de:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Conectar tu solicitud con cuidadores verificados con RETHUS.</li>
                  <li>Procesar pagos y emitir facturación electrónica.</li>
                  <li>Garantizar tu seguridad mediante geolocalización durante el servicio.</li>
                  <li>Atender emergencias y notificar a tu contacto designado.</li>
                </ul>
                <p className="mt-2">
                  Puedes ejercer tus derechos de conocer, actualizar, rectificar y suprimir tus datos en
                  cualquier momento escribiendo a <strong>privacidad@humanix.co</strong>.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-biosensor/30 bg-biosensor/5 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={habeasOk}
                  onChange={(e) => setHabeasOk(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-input accent-biosensor"
                />
                <span className="text-sm">
                  Acepto el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la
                  Política de Privacidad de Humanix.
                </span>
              </label>

              <div className="rounded-xl border border-copper/30 bg-copper/5 p-3.5 text-xs leading-relaxed">
                <strong className="text-copper">Comisión Humanix:</strong> únicamente cobramos un{" "}
                <strong>3%</strong> sobre cada contratación. Este porcentaje cubre verificación de
                identidad, soporte 24/7, seguro de responsabilidad civil y la línea de emergencia.
                El profesional recibe el <strong>97%</strong> restante.
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={step === 0 || saving}
              className="min-w-24"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="hero" onClick={next} className="min-w-32">
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" variant="hero" onClick={submit} disabled={saving} className="min-w-40">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Finalizar y buscar
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-fuchsia-neural">*</span>}
      </Label>
      {children}
    </div>
  );
}
