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
  AlertTriangle,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { FamilyDocumentsManager } from "@/components/humanix/FamilyDocumentsManager";

type Props = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
};

type RequirementKey = "avatar" | "id_number" | "address" | "emergency" | "id_document" | "utility_bill";

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
        {
          key: "utility_bill",
          label: "Recibo de servicios",
          short: "Recibo",
          icon: FileText,
          done: has("utility_bill"),
          hint: "Reciente (≤60 días) para confirmar tu dirección.",
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
  const missing = reqs.filter((r) => !r.done);
  const complete = done === total;

  return (
    <Card
      className={`overflow-hidden border-2 transition-colors ${
        complete
          ? "border-biosensor/40 bg-gradient-to-br from-biosensor/10 via-biosensor/5 to-transparent"
          : percent >= 50
            ? "border-copper/40 bg-gradient-to-br from-copper/10 via-copper/5 to-transparent"
            : "border-fuchsia-neural/40 bg-gradient-to-br from-fuchsia-neural/10 via-fuchsia-neural/5 to-transparent"
      }`}
    >
      {/* Cabecera */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
            complete
              ? "bg-biosensor/20 text-biosensor"
              : percent >= 50
                ? "bg-copper/20 text-copper"
                : "bg-fuchsia-neural/20 text-fuchsia-neural"
          }`}
        >
          {complete ? (
            <ShieldCheck className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-display text-base sm:text-lg font-semibold leading-tight">
                {complete
                  ? `${fullName.split(" ")[0]}, tu perfil está listo 🎉`
                  : "Completa tu perfil para contratar de forma segura"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {complete
                  ? "Cumples con todos los requisitos. Los profesionales verán tu perfil con máxima confianza."
                  : "Te tomará menos de 2 minutos: foto, cédula, dirección y contacto de emergencia."}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${
                complete
                  ? "bg-biosensor/15 text-biosensor border-biosensor/40"
                  : percent >= 50
                    ? "bg-copper/15 text-copper border-copper/40"
                    : "bg-fuchsia-neural/15 text-fuchsia-neural border-fuchsia-neural/40"
              }`}
            >
              {done}/{total} · {percent}%
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <Progress
              value={percent}
              className={`h-2 ${
                complete
                  ? "[&>div]:bg-biosensor"
                  : percent >= 50
                    ? "[&>div]:bg-copper"
                    : "[&>div]:bg-fuchsia-neural"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Grid de requisitos */}
      <div className="px-5 sm:px-6 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {reqs.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.key}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                  r.done
                    ? "border-biosensor/30 bg-biosensor/5 text-biosensor"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
                title={r.hint}
              >
                {r.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="font-medium truncate">{r.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta de faltantes + CTA */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        {missing.length > 0 ? (
          <div className="flex items-start gap-2 rounded-lg bg-background/60 border border-copper/20 p-3 flex-1">
            <AlertTriangle className="h-4 w-4 text-copper mt-0.5 shrink-0" />
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-foreground">
                Te falta{missing.length > 1 ? "n" : ""}:
              </p>
              <p className="text-muted-foreground mt-0.5 line-clamp-2">
                {missing.map((m) => m.label).join(" · ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-biosensor/5 border border-biosensor/20 p-3 flex-1">
            <CheckCircle2 className="h-4 w-4 text-biosensor mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Verificado por IA · RETHUS cruzado · Documentos auditados.
            </p>
          </div>
        )}
        <Button variant={complete ? "outline" : "hero"} asChild className="w-full sm:w-auto">
          <Link to="/dashboard/familia/onboarding">
            {complete ? "Editar perfil" : "Completar ahora"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Adjuntar documentos sin salir del dashboard */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-2">
        <button
          type="button"
          onClick={() => setDocsOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 hover:bg-muted/40 px-3 py-2.5 text-sm font-medium transition-colors"
          aria-expanded={docsOpen}
        >
          <span className="inline-flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-fuchsia-neural" />
            Adjuntar documentos ahora
            <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">
              · cédula, recibo, historia clínica…
            </span>
          </span>
          {docsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {docsOpen && (
          <div className="mt-3 rounded-xl border border-border bg-background/40 p-3 sm:p-4">
            <FamilyDocumentsManager userId={userId} />
          </div>
        )}
      </div>
    </Card>
  );
}
