import { useEffect, useRef, useState } from "react";
import {
  FileText,
  IdCard,
  GraduationCap,
  ShieldCheck,
  UploadCloud,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Receipt,
  Briefcase,
  ShieldAlert,
  Stethoscope,
  Scale,
  Gavel,
  Fingerprint,
  AlertTriangle,
  HeartPulse,
  PiggyBank,
  HardHat,
  Ban,
  FileBadge,
  Landmark,
  FileSpreadsheet,
  FilePlus2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DocType =
  | "cv"
  | "rethus"
  | "diploma"
  | "id_document"
  | "utility_bill"
  | "work_experience"
  | "public_function_cv"
  | "medical_exam"
  | "contraloria"
  | "procuraduria"
  | "criminal_record"
  | "corrective_measures"
  | "health_affiliation"
  | "pension_affiliation"
  | "arl_affiliation"
  | "redam"
  | "disqualifications"
  | "assets_declaration"
  | "bank_account"
  | "other";
type DocStatus = "pending" | "approved" | "rejected";

type Doc = {
  id: string;
  doc_type: DocType;
  file_url: string;
  file_name: string | null;
  status: DocStatus;
  reviewer_note: string | null;
  ai_verified?: boolean | null;
  ai_score?: number | null;
  ai_notes?: string | null;
  created_at: string;
};

const TYPES: {
  value: DocType;
  label: string;
  icon: React.ReactNode;
  hint: string;
  cvParse?: boolean;
  required?: boolean;
  group?: string;
}[] = [
  {
    value: "cv",
    label: "Hoja de vida",
    icon: <FileText className="h-4 w-4" />,
    hint: "PDF · La IA extrae tus datos.",
    cvParse: true,
    required: true,
  },
  {
    value: "rethus",
    label: "Documento RETHUS",
    icon: <ShieldCheck className="h-4 w-4" />,
    hint: "Opcional si subes diploma. PDF o foto.",
    group: "credencial",
  },
  {
    value: "diploma",
    label: "Diploma / Certificación",
    icon: <GraduationCap className="h-4 w-4" />,
    hint: "Opcional si subes RETHUS. Diploma profesional, BLS, ACLS, etc.",
    group: "credencial",
  },
  {
    value: "id_document",
    label: "Cédula",
    icon: <IdCard className="h-4 w-4" />,
    hint: "Frente y reverso.",
    required: true,
  },
  {
    value: "utility_bill",
    label: "Recibo de servicios públicos",
    icon: <Receipt className="h-4 w-4" />,
    hint: "Reciente (últimos 60 días). Verifica tu dirección.",
    required: true,
  },
  {
    value: "work_experience",
    label: "Certificado de experiencia laboral",
    icon: <Briefcase className="h-4 w-4" />,
    hint: "Constancia de empleos previos en salud.",
  },
  {
    value: "public_function_cv",
    label: "Hoja de vida Función Pública",
    icon: <FileText className="h-4 w-4" />,
    hint: "Formato SIGEP / Función Pública. PDF.",
  },
  {
    value: "medical_exam",
    label: "Examen médico ocupacional",
    icon: <Stethoscope className="h-4 w-4" />,
    hint: "Vigencia recomendada 3 años. PDF o foto.",
  },
  {
    value: "rethus",
    label: "RETHUS",
    icon: <ShieldCheck className="h-4 w-4" />,
    hint: "Certificado vigente del Registro Único de Talento Humano en Salud.",
  },
  {
    value: "rethus",
    label: "RETHUS",
    icon: <ShieldCheck className="h-4 w-4" />,
    hint: "Certificado vigente del Registro Único de Talento Humano en Salud.",
  },
  {
    value: "contraloria",
    label: "Antecedentes Contraloría",
    icon: <Landmark className="h-4 w-4" />,
    hint: "Certificado de responsabilidad fiscal.",
  },
  {
    value: "procuraduria",
    label: "Antecedentes Procuraduría",
    icon: <Scale className="h-4 w-4" />,
    hint: "Certificado de antecedentes disciplinarios.",
  },
  {
    value: "criminal_record",
    label: "Antecedentes Penales / Judiciales",
    icon: <Gavel className="h-4 w-4" />,
    hint: "Policía Nacional · requerimientos judiciales.",
  },
  {
    value: "corrective_measures",
    label: "Antecedentes Medidas Correctivas",
    icon: <AlertTriangle className="h-4 w-4" />,
    hint: "RNMC · Policía Nacional.",
  },
  {
    value: "redam",
    label: "REDAM",
    icon: <Ban className="h-4 w-4" />,
    hint: "Registro de Deudores Alimentarios Morosos.",
  },
  {
    value: "disqualifications",
    label: "Consulta de inhabilidades",
    icon: <Fingerprint className="h-4 w-4" />,
    hint: "Inhabilidades por delitos sexuales contra menores.",
  },
  {
    value: "health_affiliation",
    label: "Afiliación Salud (EPS)",
    icon: <HeartPulse className="h-4 w-4" />,
    hint: "Certificado de afiliación vigente.",
  },
  {
    value: "pension_affiliation",
    label: "Afiliación Pensión",
    icon: <PiggyBank className="h-4 w-4" />,
    hint: "Fondo de pensiones · certificado vigente.",
  },
  {
    value: "arl_affiliation",
    label: "Afiliación ARL",
    icon: <HardHat className="h-4 w-4" />,
    hint: "Riesgos laborales · certificado vigente.",
  },
  {
    value: "assets_declaration",
    label: "Declaración de bienes y rentas",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    hint: "Formato SIGEP de bienes y rentas.",
  },
  {
    value: "bank_account",
    label: "Certificación cuenta bancaria",
    icon: <FileBadge className="h-4 w-4" />,
    hint: "Certificado bancario para pagos.",
  },
  {
    value: "other",
    label: "Otro anexo",
    icon: <FilePlus2 className="h-4 w-4" />,
    hint: "Cualquier otro documento de soporte (manual).",
  },
];

export function DocumentsManager({
  userId,
  onCvExtracted,
}: {
  userId: string;
  onCvExtracted?: (profile: Record<string, unknown>) => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busyType, setBusyType] = useState<DocType | null>(null);
  const [extractingCv, setExtractingCv] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const inputRefs = useRef<Record<DocType, HTMLInputElement | null>>({
    cv: null,
    rethus: null,
    diploma: null,
    id_document: null,
    utility_bill: null,
    work_experience: null,
    public_function_cv: null,
    medical_exam: null,
    contraloria: null,
    procuraduria: null,
    criminal_record: null,
    corrective_measures: null,
    health_affiliation: null,
    pension_affiliation: null,
    arl_affiliation: null,
    redam: null,
    disqualifications: null,
    assets_declaration: null,
    bank_account: null,
    other: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("professional_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (active && data) setDocs(data as unknown as Doc[]);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const upload = async (type: DocType, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Máximo 15MB");
      return;
    }
    setBusyType(type);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${type}-${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("professional-docs")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const file_url = path;
      const { data: row, error } = await supabase
        .from("professional_documents")
        .insert({ user_id: userId, doc_type: type, file_url, file_name: file.name })
        .select()
        .single();
      if (error) throw error;
      const newDoc = row as unknown as Doc;
      setDocs((prev) => [newDoc, ...prev]);
      toast.success("Documento subido. Verificando con IA…");

      // Generar URL firmada para que la IA pueda leerlo
      const { data: signed } = await supabase.storage
        .from("professional-docs")
        .createSignedUrl(path, 120);
      if (!signed?.signedUrl) {
        toast.warning("No se pudo verificar automáticamente. Quedó pendiente para revisión.");
        return;
      }

      // 1) CV → extracción de perfil
      if (type === "cv" && onCvExtracted) {
        setExtractingCv(true);
        try {
          const { data: ext, error: e2 } = await supabase.functions.invoke("cv-extractor", {
            body: { file_url: signed.signedUrl, mime_type: file.type },
          });
          if (e2) throw e2;
          if (ext?.profile) {
            onCvExtracted(ext.profile);
            toast.success("✨ Datos extraídos del CV. Revísalos antes de guardar.");
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo analizar el CV");
        } finally {
          setExtractingCv(false);
        }
      }

      // 2) Verificación IA: rechaza si no es real / no coincide
      setVerifyingId(newDoc.id);
      try {
        const { data: vr, error: ve } = await supabase.functions.invoke("document-verifier", {
          body: { file_url: signed.signedUrl, mime_type: file.type, doc_type: type },
        });
        if (ve) throw ve;
        const v = vr?.verification;
        if (!v) throw new Error("Sin respuesta de verificación");
        const isValid = !!v.is_valid && Number(v.confidence ?? 0) >= 60;
        const newStatus: DocStatus = isValid ? "pending" : "rejected";
        const updates = {
          ai_verified: isValid,
          ai_score: typeof v.confidence === "number" ? v.confidence : null,
          ai_notes: v.reason ?? null,
          ai_extracted: v.extracted ?? null,
          reviewer_note: !isValid ? (v.reason ?? "Documento rechazado por IA") : null,
          status: newStatus,
        };
        const { data: upd } = await supabase
          .from("professional_documents")
          .update(updates as never)
          .eq("id", newDoc.id)
          .select()
          .single();
        if (upd) {
          setDocs((prev) => prev.map((d) => (d.id === newDoc.id ? (upd as unknown as Doc) : d)));
        }
        if (isValid) {
          toast.success(`✅ Documento verificado por IA (${Math.round(v.confidence)}%)`);
        } else {
          toast.error(`❌ Rechazado: ${v.reason ?? "no coincide con el tipo declarado"}`);
        }
      } catch (e) {
        // No bloqueamos si IA falla, queda pendiente para staff
        console.warn("[verify]", e);
        toast.warning(
          "Documento subido. La verificación IA no estuvo disponible; quedó pendiente.",
        );
      } finally {
        setVerifyingId(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusyType(null);
    }
  };

  const openDoc = async (doc: Doc) => {
    try {
      const path = extractPath(doc.file_url);
      if (!path) throw new Error("Ruta no válida");
      const { data, error } = await supabase.storage
        .from("professional-docs")
        .createSignedUrl(path, 60);
      if (error || !data?.signedUrl) throw error ?? new Error("No se pudo abrir");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir el documento");
    }
  };

  const remove = async (doc: Doc) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      const path = extractPath(doc.file_url);
      if (path) await supabase.storage.from("professional-docs").remove([path]);
      await supabase.from("professional_documents").delete().eq("id", doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const docsByType = (t: DocType) => docs.filter((d) => d.doc_type === t);

  const hasDoc = (t: DocType) => docs.some((d) => d.doc_type === t && d.status !== "rejected");
  const requiredMissing = TYPES.filter((t) => t.required && !hasDoc(t.value)).length;
  const credencialMissing = !hasDoc("rethus") && !hasDoc("diploma");
  const totalMissing = requiredMissing + (credencialMissing ? 1 : 0);

  return (
    <div className="space-y-4">
      {totalMissing > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-700 dark:text-amber-400">
            Te faltan <strong>{totalMissing}</strong> documento(s) por subir.
            {credencialMissing && (
              <>
                {" "}
                Debes subir <strong>RETHUS</strong> o <strong>diploma</strong> (al menos uno).
              </>
            )}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TYPES.map((t) => {
          const items = docsByType(t.value);
          const busy = busyType === t.value || (t.cvParse && extractingCv);
          return (
            <div key={t.value} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-foreground">
                    {t.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      {t.label}
                      {t.required && <span className="text-[10px] text-rose-500">*</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t.hint}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="glass"
                  disabled={busy}
                  onClick={() => inputRefs.current[t.value]?.click()}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5 text-xs">Subir</span>
                </Button>
                <input
                  ref={(el) => {
                    inputRefs.current[t.value] = el;
                  }}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(t.value, f);
                    e.target.value = "";
                  }}
                />
              </div>
              {t.value === "cv" && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-fuchsia-neural">
                  <Sparkles className="h-3 w-3" /> Auto-llenado por IA
                </p>
              )}
              {items.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {items.map((d) => (
                    <li key={d.id} className="text-xs bg-muted/30 rounded px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openDoc(d)}
                          className="truncate flex-1 text-left hover:underline"
                        >
                          {d.file_name || "Documento"}
                        </button>
                        {verifyingId === d.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        <StatusBadge status={d.status} aiVerified={d.ai_verified ?? false} />
                        <button
                          onClick={() => remove(d)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar documento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {d.ai_notes && (
                        <p
                          className={`mt-1 text-[10.5px] ${
                            d.status === "rejected" ? "text-rose-600" : "text-muted-foreground"
                          }`}
                        >
                          {d.status === "rejected" ? "❌ " : "🤖 "}
                          {d.ai_notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status, aiVerified }: { status: DocStatus; aiVerified: boolean }) {
  const map = {
    pending: {
      icon: <Clock className="h-3 w-3" />,
      label: aiVerified ? "IA ✓ pendiente staff" : "Pendiente",
      cls: aiVerified ? "bg-biosensor/10 text-biosensor" : "bg-amber-500/10 text-amber-600",
    },
    approved: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Aprobado",
      cls: "bg-emerald-500/10 text-emerald-600",
    },
    rejected: {
      icon: <XCircle className="h-3 w-3" />,
      label: "Rechazado",
      cls: "bg-rose-500/10 text-rose-600",
    },
  } as const;
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${s.cls} whitespace-nowrap`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function extractPath(stored: string): string | null {
  if (!stored) return null;
  if (!stored.includes("://")) return stored;
  try {
    const url = new URL(stored);
    const idx = url.pathname.indexOf("/professional-docs/");
    return idx >= 0 ? url.pathname.slice(idx + "/professional-docs/".length) : null;
  } catch {
    return null;
  }
}
