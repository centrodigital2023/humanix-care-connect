import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Camera,
  IdCard,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FamilyDocumentsManager } from "@/components/humanix/FamilyDocumentsManager";

type Props = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
};

type RequirementKey = "avatar" | "id_number" | "address" | "emergency" | "id_document";

type Requirement = {
  key: RequirementKey;
  label: string;
  short: string;
  icon: typeof ShieldCheck;
  done: boolean;
  hint: string;
};

/**
 * Tarjeta inteligente de completitud del perfil familiar.
 * Muestra progreso en tiempo real, qué falta con iconos, y lleva al onboarding.
 */
export function SmartProfileCard({ userId, fullName, avatarUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [docsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [famRes, docsRes] = await Promise.all([
        supabase
          .from("family_profiles")
          .select("id_number, default_address, emergency_contact_phone, habeas_data_accepted")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("family_documents" as never)
          .select("doc_type,status")
          .eq("user_id", userId),
      ]);
      if (!active) return;
      const fam = famRes.data as
        | {
            id_number: string | null;
            default_address: string | null;
            emergency_contact_phone: string | null;
            habeas_data_accepted: boolean | null;
          }
        | null;
      const docs = ((docsRes.data ?? []) as Array<{ doc_type: string; status: string }>).filter(
        (d) => d.status !== "rejected",
      );
      const has = (t: string) => docs.some((d) => d.doc_type === t);

      const list: Requirement[] = [
        {
          key: "avatar",
          label: "Foto de perfil",
          short: "Foto",
          icon: Camera,
          done: !!avatarUrl,
          hint: "Tu cara ayuda a que los profesionales confíen en ti.",
        },
        {
          key: "id_number",
          label: "Cédula",
          short: "Cédula",
          icon: IdCard,
          done: !!fam?.id_number,
          hint: "Número de identificación oficial.",
        },
        {
          key: "address",
          label: "Dirección",
          short: "Dirección",
          icon: MapPin,
          done: !!fam?.default_address,
          hint: "Dónde recibirás el servicio.",
        },
        {
          key: "emergency",
          label: "Contacto de emergencia",
          short: "Emergencia",
          icon: Phone,
          done: !!fam?.emergency_contact_phone,
          hint: "Un familiar que pueda responder en caso de urgencia.",
        },
        {
          key: "id_document",
          label: "Cédula digital",
          short: "Cédula IA",
          icon: FileText,
          done: has("id_document"),
          hint: "Foto frente y reverso — la IA valida que sea real.",
        },
      ];
      setReqs(list);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`fam-profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_profiles", filter: `user_id=eq.${userId}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_documents", filter: `user_id=eq.${userId}` },
        load,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, avatarUrl]);

  if (loading) {
    return (
      <Card className="p-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Analizando tu perfil…
      </Card>
    );
  }

  const done = reqs.filter((r) => r.done).length;
  const total = reqs.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done === total;
  const nextReq = reqs.find((r) => !r.done);
  const firstName = fullName.split(" ")[0] || "Hola";

  // Tono cromático segun progreso
  const tone = complete
    ? { ring: "stroke-biosensor", text: "text-biosensor", soft: "bg-biosensor/10", border: "border-biosensor/30" }
    : percent >= 50
      ? { ring: "stroke-copper", text: "text-copper", soft: "bg-copper/10", border: "border-copper/30" }
      : { ring: "stroke-fuchsia-neural", text: "text-fuchsia-neural", soft: "bg-fuchsia-neural/10", border: "border-fuchsia-neural/30" };

  const circumference = 2 * Math.PI * 28;
  const dash = (percent / 100) * circumference;

  return (
    <Card className="overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm">
      {/* Hero: anillo de progreso + copy */}
      <div className="relative p-5 sm:p-6">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-32 ${tone.soft} opacity-60 blur-2xl`}
          aria-hidden
        />
        <div className="relative flex items-center gap-4 sm:gap-5">
          {/* Anillo SVG */}
          <div className="relative shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle cx="36" cy="36" r="28" className="stroke-muted/40" strokeWidth="6" fill="none" />
              <circle
                cx="36"
                cy="36"
                r="28"
                className={`${tone.ring} transition-all duration-700`}
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {complete ? (
                <ShieldCheck className={`h-6 w-6 ${tone.text}`} />
              ) : (
                <span className={`text-base font-semibold ${tone.text}`}>{percent}%</span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {complete ? "Perfil verificado" : `Paso ${done + 1} de ${total}`}
            </p>
            <h3 className="mt-0.5 font-display text-lg sm:text-xl font-semibold leading-tight">
              {complete
                ? `${firstName}, tu perfil está listo`
                : "Completa tu perfil"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {complete
                ? "Los profesionales verán tu perfil con máxima confianza."
                : nextReq
                  ? <>Siguiente: <span className="font-medium text-foreground">{nextReq.label}</span> · {nextReq.hint}</>
                  : "Menos de 2 minutos."}
            </p>
          </div>
        </div>

        {/* Track horizontal de requisitos */}
        <ol className="relative mt-5 flex items-center gap-1.5">
          {reqs.map((r) => {
            const Icon = r.icon;
            return (
              <li
                key={r.key}
                title={`${r.label} — ${r.hint}`}
                className={`group flex-1 flex flex-col items-center gap-1.5`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    r.done
                      ? "border-biosensor/40 bg-biosensor/10 text-biosensor"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {r.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] truncate max-w-full ${
                    r.done ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {r.short}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Acciones */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <Button variant={complete ? "outline" : "hero"} asChild className="flex-1 sm:flex-none">
            <Link to="/dashboard/familia/onboarding">
              <Sparkles className="h-4 w-4 mr-1.5" />
              {complete ? "Editar perfil" : "Completar ahora"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDocsOpen((v) => !v)}
            className="flex-1 sm:flex-none justify-between sm:justify-start text-sm"
            aria-expanded={docsOpen}
          >
            <span className="inline-flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4" />
              Adjuntar documentos
            </span>
            {docsOpen ? (
              <ChevronUp className="h-4 w-4 ml-1 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Trust line — sutil */}
        {complete && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-biosensor" />
            Verificado por IA · RETHUS cruzado · Documentos auditados
          </p>
        )}
      </div>

      {/* Documentos colapsable */}
      {docsOpen && (
        <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-5">
          <FamilyDocumentsManager userId={userId} />
        </div>
      )}
    </Card>
  );
}
