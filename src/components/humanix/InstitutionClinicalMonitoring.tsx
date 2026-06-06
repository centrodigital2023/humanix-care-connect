/**
 * InstitutionClinicalMonitoring — Panel Live de monitoreo remoto multi-paciente
 * Para instituciones: agrega pacientes, ve sus signos vitales en tiempo real,
 * recibe alertas centralizadas y gestiona el seguimiento clínico remoto.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClinicalMonitor } from "./ClinicalMonitor";
import {
  Heart,
  Activity,
  AlertTriangle,
  Plus,
  Search,
  X,
  Loader2,
  Users,
  RefreshCw,
  QrCode,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  UserCircle,
  Wifi,
  WifiOff,
  ScanLine,
  Copy,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import type { SupabaseClient } from "@supabase/supabase-js";

const sb = supabase as unknown as SupabaseClient;

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonitoredPatient {
  id: string;                   // patient_user_id
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  added_at: string;
  last_vital_at: string | null;
  critical_alerts: number;
  active_alerts: number;
  online: boolean;
}

interface GlobalAlert {
  id: string;
  patient_id: string;
  patient_name: string | null;
  alert_type: string;
  actual_value: number;
  unit: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: string;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  low:      "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium:   "bg-amber-500/10 text-amber-700 border-amber-500/20",
  high:     "bg-orange-500/10 text-orange-700 border-orange-500/20",
  critical: "bg-red-500/10 text-red-700 border-red-500/20 animate-pulse",
};

const ALERT_LABELS: Record<string, string> = {
  high_heart_rate:     "FC elevada",
  low_heart_rate:      "FC baja",
  low_spo2:            "SpO₂ baja",
  high_temperature:    "Fiebre",
  low_temperature:     "Hipotermia",
  high_blood_pressure: "HTA",
  low_blood_pressure:  "Hipotensión",
  fall_detected:       "Caída detectada",
  inactivity:          "Inactividad",
  high_respiration:    "Taquipnea",
  sos_manual:          "SOS · Pánico",
};

// ─── Add Patient Modal ────────────────────────────────────────────────────────

interface AddPatientModalProps {
  institutionId: string;
  onAdded: () => void;
  onClose: () => void;
}

function AddPatientModal({ institutionId, onAdded, onClose }: AddPatientModalProps) {
  const [mode, setMode] = useState<"id" | "qr">("id");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  // QR encodes a deep-link that the patient scans to accept monitoring
  const inviteLink = `humanix://monitor-invite?institution=${institutionId}`;

  const add = async () => {
    const trimmed = patientId.trim();
    if (!trimmed) { toast.error("Ingresa el ID del paciente"); return; }
    setLoading(true);
    try {
      const { error } = await (sb as SupabaseClient)
        .from("institution_monitored_patients")
        .upsert(
          { institution_id: institutionId, patient_id: trimmed, added_at: new Date().toISOString() },
          { onConflict: "institution_id,patient_id" },
        );
      if (error) throw error;
      toast.success("Paciente agregado al panel de monitoreo");
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <UserCircle className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Agregar paciente</h3>
              <p className="text-[11px] text-muted-foreground">Seguimiento remoto en tiempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {[
            { id: "id" as const, label: "Por ID", icon: <Search className="h-3 w-3" /> },
            { id: "qr" as const, label: "Por QR",  icon: <QrCode  className="h-3 w-3" /> },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                mode === m.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {mode === "id" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">UUID del paciente</Label>
              <Input
                placeholder="Pega el ID del paciente"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value.trim())}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                El paciente puede encontrar su ID en Perfil → Mis datos.
              </p>
            </div>
            <Button onClick={add} disabled={loading || !patientId.trim()} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Agregar al panel
            </Button>
          </div>
        ) : (
          <div className="space-y-3 flex flex-col items-center">
            <p className="text-[11px] text-center text-muted-foreground">
              El paciente escanea este QR con la app Humanix para aceptar el monitoreo remoto de tu institución.
            </p>
            <div className="rounded-2xl border-4 border-violet-500/20 bg-white p-3 shadow-inner">
              <QRCode
                value={inviteLink}
                size={160}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="H"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ScanLine className="h-3 w-3 text-violet-500" />
              <span>El paciente acepta desde su app</span>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Enlace copiado"); }}
              className="flex items-center gap-1 text-[10px] text-violet-600 hover:underline"
            >
              <Copy className="h-3 w-3" /> Copiar enlace de invitación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Patient Card ─────────────────────────────────────────────────────────────

interface PatientCardProps {
  patient: MonitoredPatient;
  onRemove: (id: string) => void;
  onAcknowledgeAll: (patientId: string) => void;
}

function PatientCard({ patient, onRemove }: PatientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const initials = (patient.full_name ?? "P")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Card className={cn(
      "border transition-colors",
      patient.critical_alerts > 0 && "border-red-500/40 bg-red-500/[0.02]",
      patient.active_alerts > 0 && patient.critical_alerts === 0 && "border-amber-500/30",
    )}>
      {/* Patient header */}
      <div className="p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 font-bold text-xs text-violet-700">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{patient.full_name ?? "Paciente"}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {patient.online ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <Wifi className="h-2.5 w-2.5" /> En línea
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <WifiOff className="h-2.5 w-2.5" /> Sin datos recientes
              </span>
            )}
            {patient.last_vital_at && (
              <span className="text-[10px] text-muted-foreground">
                · Última: {formatDistanceToNow(new Date(patient.last_vital_at), { locale: es, addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {patient.critical_alerts > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] h-5 px-1.5 animate-pulse">
              {patient.critical_alerts} crítica{patient.critical_alerts > 1 ? "s" : ""}
            </Badge>
          )}
          {patient.active_alerts > 0 && patient.critical_alerts === 0 && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-700 text-[10px] h-5 px-1.5">
              {patient.active_alerts} alerta{patient.active_alerts > 1 ? "s" : ""}
            </Badge>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => onRemove(patient.id)}
            className="rounded-lg p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
            title="Quitar del panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded vital signs */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <ClinicalMonitor
            patientId={patient.id}
            showDeviceGuide={false}
            compact={true}
          />
        </div>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  institutionId: string;
}

type AlertFilter = "all" | "critical" | "high" | "medium";

export function InstitutionClinicalMonitoring({ institutionId }: Props) {
  const [patients, setPatients] = useState<MonitoredPatient[]>([]);
  const [globalAlerts, setGlobalAlerts] = useState<GlobalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
  const [alertsOpen, setAlertsOpen] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load patients and their summary ───────────────────────────────────────

  const loadPatients = useCallback(async () => {
    try {
      // 1. Get monitored patient IDs
      const { data: rows, error } = await (sb as SupabaseClient)
        .from("institution_monitored_patients")
        .select("patient_id, added_at")
        .eq("institution_id", institutionId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      if (!rows || rows.length === 0) {
        setPatients([]);
        return;
      }

      const patientIds = (rows as { patient_id: string; added_at: string }[]).map((r) => r.patient_id);

      // 2. Fetch profiles
      const [profilesRes, vitalsRes, alertsRes] = await Promise.all([
        (sb as SupabaseClient)
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone")
          .in("user_id", patientIds),

        // Latest vital per patient (last 2h = online)
        (sb as SupabaseClient)
          .from("vital_signs")
          .select("patient_id, recorded_at")
          .in("patient_id", patientIds)
          .gte("recorded_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order("recorded_at", { ascending: false }),

        // Active alerts per patient
        (sb as SupabaseClient)
          .from("clinical_alerts")
          .select("id, patient_id, alert_type, actual_value, unit, severity, status, created_at")
          .in("patient_id", patientIds)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const profileMap: Record<string, { full_name: string | null; avatar_url: string | null; phone: string | null }> = {};
      for (const p of (profilesRes.data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null; phone: string | null }[]) {
        profileMap[p.user_id] = p;
      }

      // Latest vital per patient
      const latestVital: Record<string, string> = {};
      const onlineSet = new Set<string>();
      for (const v of (vitalsRes.data ?? []) as { patient_id: string; recorded_at: string }[]) {
        if (!latestVital[v.patient_id]) latestVital[v.patient_id] = v.recorded_at;
        onlineSet.add(v.patient_id);
      }

      // Alert counts per patient
      const criticalCount: Record<string, number> = {};
      const activeCount: Record<string, number> = {};
      const alertsByPatient: Record<string, GlobalAlert[]> = {};

      for (const a of (alertsRes.data ?? []) as (GlobalAlert & { patient_id: string })[]) {
        activeCount[a.patient_id] = (activeCount[a.patient_id] ?? 0) + 1;
        if (a.severity === "critical") {
          criticalCount[a.patient_id] = (criticalCount[a.patient_id] ?? 0) + 1;
        }
        if (!alertsByPatient[a.patient_id]) alertsByPatient[a.patient_id] = [];
        alertsByPatient[a.patient_id].push({
          ...a,
          patient_name: profileMap[a.patient_id]?.full_name ?? null,
        });
      }

      const patientList: MonitoredPatient[] = rows.map((r: { patient_id: string; added_at: string }) => ({
        id: r.patient_id,
        full_name: profileMap[r.patient_id]?.full_name ?? null,
        avatar_url: profileMap[r.patient_id]?.avatar_url ?? null,
        phone: profileMap[r.patient_id]?.phone ?? null,
        added_at: r.added_at,
        last_vital_at: latestVital[r.patient_id] ?? null,
        online: onlineSet.has(r.patient_id),
        critical_alerts: criticalCount[r.patient_id] ?? 0,
        active_alerts: activeCount[r.patient_id] ?? 0,
      }));

      // Sort: critical first, then online, then alphabetical
      patientList.sort((a, b) => {
        if (b.critical_alerts !== a.critical_alerts) return b.critical_alerts - a.critical_alerts;
        if (b.active_alerts !== a.active_alerts) return b.active_alerts - a.active_alerts;
        if (b.online !== a.online) return b.online ? 1 : -1;
        return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      });

      setPatients(patientList);

      // Build global alerts (all patients, sorted by severity then date)
      const allAlerts: GlobalAlert[] = Object.values(alertsByPatient).flat();
      allAlerts.sort((a, b) => {
        const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const ds = (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
        if (ds !== 0) return ds;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setGlobalAlerts(allAlerts);
    } catch (err) {
      console.warn("[InstitutionMonitoring] loadPatients:", err);
    }
  }, [institutionId]);

  const refresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    loadPatients().finally(() => setLoading(false));

    // Real-time: new vital signs or alerts trigger a reload
    const channel = supabase
      .channel(`inst-monitoring-${institutionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vital_signs" }, () => loadPatients())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "clinical_alerts" }, (payload) => {
        loadPatients();
        const a = payload.new as GlobalAlert;
        if (a.severity === "critical") {
          toast.error(`Alerta crítica · ${ALERT_LABELS[a.alert_type] ?? a.alert_type}`, {
            description: `${a.actual_value} ${a.unit ?? ""}`,
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "institution_monitored_patients" }, () => loadPatients())
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [institutionId, loadPatients]);

  const removePatient = async (patientId: string) => {
    const { error } = await (sb as SupabaseClient)
      .from("institution_monitored_patients")
      .delete()
      .eq("institution_id", institutionId)
      .eq("patient_id", patientId);
    if (!error) {
      toast.success("Paciente retirado del panel");
      loadPatients();
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await (sb as SupabaseClient)
      .from("clinical_alerts")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString() })
      .eq("id", alertId);
    if (!error) {
      setGlobalAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerta reconocida");
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const totalCritical = patients.reduce((s, p) => s + p.critical_alerts, 0);
  const totalAlerts   = patients.reduce((s, p) => s + p.active_alerts, 0);
  const onlineCount   = patients.filter((p) => p.online).length;

  const filteredPatients = patients.filter((p) => {
    const matchSearch = !search || (p.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const filteredAlerts = globalAlerts.filter((a) =>
    alertFilter === "all" ? true : a.severity === alertFilter,
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add patient modal */}
      {showAdd && (
        <AddPatientModal
          institutionId={institutionId}
          onAdded={loadPatients}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-background to-rose-500/10 border border-border p-5">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-base font-display">Monitoreo Remoto · Live</p>
              <p className="text-xs text-muted-foreground">
                {patients.length} paciente{patients.length !== 1 ? "s" : ""} · {onlineCount} en línea
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {totalCritical > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-red-500 text-white font-bold animate-pulse">
                <AlertTriangle className="h-3 w-3" /> {totalCritical} crítica{totalCritical > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20 font-medium">
              <Sparkles className="h-3 w-3" /> IA clínica
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Pacientes", value: patients.length, icon: <Users className="h-3.5 w-3.5 text-violet-500" /> },
            { label: "En línea",  value: onlineCount,     icon: <Wifi  className="h-3.5 w-3.5 text-emerald-500" /> },
            { label: "Alertas",   value: totalAlerts,     icon: <Bell  className="h-3.5 w-3.5 text-amber-500" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-background/70 border border-border p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">{s.icon}</div>
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
          className="h-8 text-xs gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          className="h-8 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-3 w-3" /> Agregar paciente
        </Button>
      </div>

      {/* Global alerts panel */}
      {globalAlerts.length > 0 && (
        <Card className={cn(
          "border",
          totalCritical > 0 ? "border-red-500/40 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5",
        )}>
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full flex items-center justify-between p-3 text-sm font-semibold"
          >
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 ${totalCritical > 0 ? "text-red-500 animate-bounce" : "text-amber-500"}`} />
              <span>Panel de alertas — {totalAlerts} activa{totalAlerts > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter */}
              <div className="flex items-center gap-1 text-[10px]">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-[10px] focus:outline-none"
                >
                  <option value="all">Todas</option>
                  <option value="critical">Críticas</option>
                  <option value="high">Altas</option>
                  <option value="medium">Medias</option>
                </select>
              </div>
              {alertsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>

          {alertsOpen && (
            <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 p-2 rounded-xl border bg-card"
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${SEVERITY_COLORS[alert.severity]}`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {alert.patient_name ?? "Paciente"} · {ALERT_LABELS[alert.alert_type] ?? alert.alert_type}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {alert.actual_value} {alert.unit} ·{" "}
                      {formatDistanceToNow(new Date(alert.created_at), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2 whitespace-nowrap flex-shrink-0"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    OK
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Empty state */}
      {patients.length === 0 && (
        <Card className="p-10 text-center border-dashed">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-bold text-sm mb-2">Sin pacientes en monitoreo</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
            Agrega pacientes para ver sus signos vitales en tiempo real, recibir alertas clínicas y gestionar su seguimiento remoto.
          </p>
          <Button onClick={() => setShowAdd(true)} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <QrCode className="h-4 w-4" /> Agregar primer paciente
          </Button>
        </Card>
      )}

      {/* Patient grid */}
      {filteredPatients.length > 0 && (
        <div className="space-y-3">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onRemove={removePatient}
              onAcknowledgeAll={() => {}}
            />
          ))}
        </div>
      )}

      {filteredPatients.length === 0 && patients.length > 0 && (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No hay pacientes que coincidan con "{search}"</p>
        </Card>
      )}
    </div>
  );
}
