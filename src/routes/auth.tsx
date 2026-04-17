import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Lock, User, Building2, HeartHandshake, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/humanix/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Crear cuenta o iniciar sesión · Humanix" },
      {
        name: "description",
        content: "Accede a Humanix como profesional, familia o institución de salud.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "professional" | "family" | "institution";

const roleConfig: Record<Role, { label: string; desc: string; icon: typeof Stethoscope; accent: string }> = {
  professional: {
    label: "Profesional",
    desc: "Enfermero, auxiliar o cuidador",
    icon: Stethoscope,
    accent: "biosensor",
  },
  family: {
    label: "Familia",
    desc: "Busco cuidado para un familiar",
    icon: HeartHandshake,
    accent: "copper",
  },
  institution: {
    label: "IPS / Clínica",
    desc: "Publico ofertas para mi institución",
    icon: Building2,
    accent: "fuchsia-neural",
  },
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [role, setRole] = useState<Role>("professional");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              phone,
              city,
              role,
              institution_name: institutionName,
            },
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Bienvenido a Humanix.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Hola de nuevo!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo salió mal";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-aurora">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-10 items-start">
          <div className="hidden lg:block sticky top-10">
            <span className="text-xs uppercase tracking-[0.2em] text-biosensor font-semibold">
              Humanix
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight">
              Crea tu cuenta y empieza a conectar{" "}
              <span className="text-gradient-bio">en minutos</span>.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
              Verificación RETHUS, asistente de IA para tu perfil, ofertas en
              tiempo real y pagos inmediatos. Todo en un solo lugar.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-biosensor" />
                Match con familias y clínicas a menos de 150 ms
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-copper" />
                Trust Score y reputación verificable
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-neural" />
                Cobros inmediatos en Nequi, PSE y RappiPay (próximamente)
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl shadow-[var(--shadow-elegant)] p-6 sm:p-8">
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1 mb-6">
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Crear cuenta
              </button>
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  mode === "signin"
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Iniciar sesión
              </button>
            </div>

            {mode === "signup" && (
              <div className="mb-5">
                <Label className="mb-2 block">¿Cómo te identificas?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as Role[]).map((r) => {
                    const c = roleConfig[r];
                    const Icon = c.icon;
                    const active = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-3 rounded-xl border text-left transition ${
                          active
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <Icon className={`h-4 w-4 text-${c.accent}`} />
                        <p className="mt-2 text-xs font-semibold">{c.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{c.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-9"
                        placeholder="María García"
                      />
                    </div>
                  </div>
                  {role === "institution" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="institutionName">Nombre de la institución</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="institutionName"
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          required
                          className="pl-9"
                          placeholder="Clínica Reina Sofía"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="3001234567"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bogotá"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-9"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-5 text-xs text-muted-foreground text-center">
              Al continuar aceptas los términos, política de privacidad y
              tratamiento de datos personales (Habeas Data) de Humanix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
