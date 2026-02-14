import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { checkAdminSession, fetchAdminJson, getApiUrl, logoutAdmin } from "@/api/adminClient";

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export default function AdminAppointments() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    query: "",
    startDate: "",
    endDate: "",
    status: "all",
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        await checkAdminSession();
        if (!cancelled) {
          setIsUnlocked(true);
        }
      } catch {
        if (!cancelled) {
          setIsUnlocked(false);
          navigate("/admin", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.startDate) params.set("start", filters.startDate);
    if (filters.endDate) params.set("end", filters.endDate);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    params.set("limit", "200");
    return params.toString();
  }, [filters]);

  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery({
    queryKey: ["appointments", queryString, isUnlocked],
    queryFn: () => fetchAdminJson(getApiUrl(`/api/appointments?${queryString}`)),
    enabled: isUnlocked,
  });

  useEffect(() => {
    if (appointmentsError?.message?.toLowerCase().includes("unauthorized")) {
      setIsUnlocked(false);
      navigate("/admin", { replace: true });
    }
  }, [appointmentsError, navigate]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch {
      // best-effort logout
    } finally {
      setIsUnlocked(false);
      navigate("/admin", { replace: true });
    }
  };

  const handleExport = () => {
    const headers = [
      "id",
      "start_time",
      "end_time",
      "first_name",
      "last_name",
      "service_name",
      "contact_email",
      "contact_phone",
      "notes",
      "status",
      "created_at",
    ];

    const rows = appointments.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur max-w-xl mx-auto">
            <CardContent className="p-6 space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
            <CardTitle className="text-2xl">Appointments Admin</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  value={filters.query}
                  onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                  placeholder="Name, email, phone"
                  className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
                  className="mt-2 bg-white border-slate-300 text-black"
                />
              </div>
              <div>
                <Label htmlFor="end">End date</Label>
                <Input
                  id="end"
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
                  className="mt-2 bg-white border-slate-300 text-black"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="mt-2 bg-white border-slate-300 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1" />
              <div className="flex items-end gap-3 md:col-span-3">
                <Button
                  type="button"
                  className="w-full bg-white/10 border border-white text-white hover:bg-white/20"
                  onClick={() => navigate("/admin/blocked-periods")}
                >
                  Manage blocked time
                </Button>
                <Button
                  type="button"
                  className="w-full bg-white/10 border border-white text-white hover:bg-white/20"
                  onClick={handleExport}
                  disabled={!appointments.length}
                >
                  Export CSV
                </Button>
                <Button
                  type="button"
                  className="w-full bg-transparent border border-white/40 text-white hover:bg-white/10"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>
            </div>

            {appointmentsError && !appointmentsError.message?.toLowerCase().includes("unauthorized") && (
              <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                <AlertDescription>{appointmentsError.message}</AlertDescription>
              </Alert>
            )}

            {appointmentsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-slate-200">No appointments found for this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-200">
                  <thead className="text-xs uppercase text-slate-300 border-b border-white/10">
                    <tr>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Patient</th>
                      <th className="py-3 pr-4">Service</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Phone</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-white/5">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {appointment.start_time
                            ? format(new Date(appointment.start_time), "MMM d, yyyy h:mm a")
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {appointment.first_name} {appointment.last_name || ""}
                        </td>
                        <td className="py-3 pr-4">{appointment.service_name || "-"}</td>
                        <td className="py-3 pr-4">{appointment.contact_email || "-"}</td>
                        <td className="py-3 pr-4">{appointment.contact_phone || "-"}</td>
                        <td className="py-3 pr-4">{appointment.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

