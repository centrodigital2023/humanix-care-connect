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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DocType = "cv" | "rethus" | "diploma" | "id_document" | "other";
type DocStatus = "pending" | "approved" | "rejected";

type Doc = {
  id: string;
  doc_type: DocType;
  file_url: string;
  file_name: string | null;
  status: DocStatus;
  reviewer_note: string | null;
  created_at: string;
};

const TYPES: { value: DocType; label: string; icon: React.ReactNode; hint: string; cvParse?: boolean }[] = [
  { value: "cv", label: "Hoja de vida", icon: <FileText className="h-4 w-4" />, hint: "PDF · La IA extraerá tus datos automáticamente.", cvParse: true },
  { value: "rethus", label: "Documento RETHUS", icon: <ShieldCheck className="h-4 w-4" />, hint: "PDF o imagen del registro RETHUS." },
  { value: "diploma", label: "Diploma / Certificación", icon: <GraduationCap className="h-4 w-4" />, hint: "BLS, ACLS, diploma profesional, etc." },
  { value: "id_document", label: "Cédula", icon: <IdCard className="h-4 w-4" />, hint: "Frente y reverso." },
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
  const inputRefs = useRef<Record<DocType, HTMLInputElement | null>>({
    cv: null,
    rethus: null,
    diploma: null,
    id_document: null,
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
      if (active && data) setDocs(data as Doc[]);
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
      // Bucket is private — store the storage path; we generate signed URLs on demand.
      const file_url = path;
      const { data: row, error } = await supabase
        .from("professional_documents")
        .insert({
          user_id: userId,
          doc_type: type,
          file_url,
          file_name: file.name,
        })
        .select()
        .single();
      if (error) throw error;
      setDocs((prev) => [row as Doc, ...prev]);
      toast.success("Documento subido");

      // Si es CV, dispara extracción usando una URL firmada de corta vida.
      if (type === "cv" && onCvExtracted) {
        setExtractingCv(true);
        toast.info("✨ Analizando tu hoja de vida con IA...");
        try {
          const { data: signed, error: sErr } = await supabase.storage
            .from("professional-docs")
            .createSignedUrl(path, 60);
          if (sErr || !signed?.signedUrl) throw sErr ?? new Error("No se pudo firmar URL");
          const { data: ext, error: e2 } = await supabase.functions.invoke("cv-extractor", {
            body: { file_url: signed.signedUrl, mime_type: file.type },
          });
          if (e2) throw e2;
          if (ext?.profile) {
            onCvExtracted(ext.profile);
            toast.success("Datos extraídos. Revísalos antes de guardar.");
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo analizar el CV");
        } finally {
          setExtractingCv(false);
        }
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

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
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
                    <p className="text-sm font-semibold">{t.label}</p>
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
                  accept={t.value === "cv" ? ".pdf,image/*" : ".pdf,image/*"}
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
                    <li key={d.id} className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => openDoc(d)}
                        className="truncate flex-1 text-left hover:underline"
                      >
                        {d.file_name || "Documento"}
                      </button>
                      <StatusBadge status={d.status} />
                      <button
                        onClick={() => remove(d)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Eliminar documento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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

function StatusBadge({ status }: { status: DocStatus }) {
  const map = {
    pending: { icon: <Clock className="h-3 w-3" />, label: "Pendiente", cls: "bg-amber-500/10 text-amber-600" },
    approved: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Aprobado", cls: "bg-emerald-500/10 text-emerald-600" },
    rejected: { icon: <XCircle className="h-3 w-3" />, label: "Rechazado", cls: "bg-rose-500/10 text-rose-600" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

// Extracts a storage path from either a stored path ("<userId>/file") or a
// legacy public URL stored before the bucket was made private.
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
