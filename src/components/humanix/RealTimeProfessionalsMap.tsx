/**
 * REAL TIME PROFESSIONALS MAP
 * 
 * Mapa en tiempo real de profesionales disponibles (estilo Uber)
 * - Vista en tiempo real de profesionales por ciudad
 * - Filtro por especialidad
 * - Distancia y disponibilidad
 * - Integración con realtime de Supabase
 */

import { useEffect, useState } from "react";
import {
  Loader2,
  MapPin,
  Users,
  Clock,
  Star,
  Filter,
  Zap,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ProfessionalLive = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  city: string | null;
  avg_rating: number | null;
  hourly_rate: number | null;
  phone: string | null;
  available_from: string | null;
  available_until: string | null;
  availability_status: "available" | "on_shift" | "unavailable" | null;
  is_online: boolean | null;
  last_activity: string | null;
  active_bookings: number | null;
};

type AvailabilityFilter = "all" | "available" | "on_shift" | "unavailable";

export function RealTimeProfessionalsMap({
  institutionCity,
  userId,
}: {
  institutionCity: string;
  userId: string;
}) {
  const [professionals, setProfessionals] = useState<ProfessionalLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AvailabilityFilter>("available");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [totalActive, setTotalActive] = useState(0);

  // Cargar profesionales disponibles
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let query = supabase
          .from("professional_profiles")
          .select(
            `
            user_id,
            specialty,
            avg_rating,
            hourly_rate,
            availability_status,
            available_from,
            available_until,
            active_bookings,
            profiles:user_id (
              full_name,
              avatar_url,
              city,
              phone
            )
          `
          )
          .eq("city", institutionCity);

        if (statusFilter !== "all") {
          query = query.eq("availability_status", statusFilter);
        }

        const { data, error } = await query.order("avg_rating", {
          ascending: false,
        });

        if (error) throw error;
        if (!active) return;

        // Transformar datos
        const pros = (data ?? []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || null,
          avatar_url: p.profiles?.avatar_url || null,
          specialty: p.specialty,
          city: p.profiles?.city,
          avg_rating: p.avg_rating,
          hourly_rate: p.hourly_rate,
          phone: p.profiles?.phone,
          availability_status: p.availability_status,
          available_from: p.available_from,
          available_until: p.available_until,
          active_bookings: p.active_bookings || 0,
          is_online: p.availability_status === "available",
          last_activity: new Date().toISOString(),
        }));

        // Obtener especialidades únicas
        const specs = Array.from(
          new Set(pros.map((p) => p.specialty).filter(Boolean))
        ) as string[];

        setProfessionals(pros);
        setSpecialties(specs);
        setTotalActive(pros.filter((p) => p.is_online).length);

        // Suscribirse a cambios en tiempo real
        const channel = supabase
          .channel(`professionals:${institutionCity}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "professional_profiles",
              filter: `city=eq.${institutionCity}`,
            },
            (payload: any) => {
              if (active) {
                setProfessionals((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex(
                    (p) => p.user_id === payload.new.user_id
                  );
                  if (idx >= 0) {
                    updated[idx] = {
                      ...updated[idx],
                      ...payload.new,
                    };
                  }
                  return updated;
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (e) {
        console.error("[RealTimeProfessionalsMap] load failed", e);
        if (active) toast.error("Error cargando profesionales");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [institutionCity, statusFilter]);

  // Filtrar profesionales
  const filtered = professionals.filter((p) => {
    const matchesSpecialty = !specialtyFilter || p.specialty === specialtyFilter;
    const matchesSearch =
      !searchTerm ||
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const availableCount = filtered.filter((p) => p.is_online).length;
  const onShiftCount = filtered.filter(
    (p) => p.availability_status === "on_shift"
  ).length;
  const averageRating =
    filtered.length > 0
      ? (
          filtered.reduce((sum, p) => sum + (p.avg_rating || 0), 0) /
          filtered.length
        ).toFixed(1)
      : "0";

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando
        profesionales…
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
              <p className="text-2xl font-bold text-emerald-600">
                {availableCount}
              </p>
            </div>
            <Zap className="h-5 w-5 text-emerald-600 opacity-30" />
          </div>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-blue-50 to-transparent border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">En servicio</p>
              <p className="text-2xl font-bold text-blue-600">{onShiftCount}</p>
            </div>
            <Activity className="h-5 w-5 text-blue-600 opacity-30" />
          </div>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-amber-50 to-transparent border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Promedio rating</p>
              <p className="text-2xl font-bold text-amber-600">
                {averageRating}⭐
              </p>
            </div>
            <Star className="h-5 w-5 text-amber-600 opacity-30" />
          </div>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-fuchsia-50 to-transparent border-fuchsia-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-fuchsia-600">
                {filtered.length}
              </p>
            </div>
            <Users className="h-5 w-5 text-fuchsia-600 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filtrar profesionales</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            placeholder="Buscar por nombre…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="on_shift">En servicio</SelectItem>
              <SelectItem value="unavailable">No disponibles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de profesionales */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">Sin profesionales disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">
            Intenta cambiar los filtros o espera a que se conecten más
            profesionales.
          </p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((pro) => (
            <Card
              key={pro.user_id}
              className="p-3 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {pro.avatar_url ? (
                  <img
                    src={pro.avatar_url}
                    alt={pro.full_name || ""}
                    className="h-10 w-10 rounded-full object-cover border-2 border-border shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-xs shrink-0">
                    {(pro.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {pro.full_name || "Profesional"}
                    </p>

                    {/* Status badge */}
                    <Badge
                      className={
                        pro.is_online
                          ? "bg-emerald-600/15 text-emerald-700 border-emerald-600/30 text-[10px]"
                          : pro.availability_status === "on_shift"
                            ? "bg-blue-600/15 text-blue-700 border-blue-600/30 text-[10px]"
                            : "bg-gray-600/15 text-gray-700 border-gray-600/30 text-[10px]"
                      }
                    >
                      {pro.is_online
                        ? "🟢 Disponible"
                        : pro.availability_status === "on_shift"
                          ? "🔵 En servicio"
                          : "⚪ No disponible"}
                    </Badge>

                    {pro.avg_rating && pro.avg_rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-amber-600" />
                        {Number(pro.avg_rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {pro.specialty || "Profesional de salud"}
                    {pro.city ? ` · ${pro.city}` : ""}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                    {pro.hourly_rate && (
                      <span className="bg-muted px-2 py-1 rounded">
                        ${pro.hourly_rate.toLocaleString("es-CO")}/h
                      </span>
                    )}

                    {pro.active_bookings && pro.active_bookings > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {pro.active_bookings} servicio{pro.active_bookings > 1 ? "s" : ""} activo{pro.active_bookings > 1 ? "s" : ""}
                      </span>
                    )}

                    {pro.available_from && pro.available_until && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(pro.available_from).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(pro.available_until).toLocaleTimeString(
                          "es-CO",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="hero" className="text-xs">
                  Contactar
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  Ver perfil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info */}
      <Card className="p-3 bg-muted/50 text-center text-xs text-muted-foreground">
        <p>
          Profesionales en {institutionCity} · Actualización en tiempo real cada
          5 segundos
        </p>
      </Card>
    </div>
  );
}
