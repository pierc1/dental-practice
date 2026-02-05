import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }
  return payload;
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export default function AdminAppointments() {
  const [filters, setFilters] = useState({
    query: "",
    startDate: "",
    endDate: "",
    status: "all",
  });
  const [adminPassword, setAdminPassword] = useState(
    sessionStorage.getItem("admin_password") || ""
  );
  const [isUnlocked, setIsUnlocked] = useState(Boolean(sessionStorage.getItem("admin_password")));
  const [authError, setAuthError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.startDate) params.set("start", filters.startDate);
    if (filters.endDate) params.set("end", filters.endDate);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    params.set("limit", "200");
    return params.toString();
  }, [filters]);

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ["appointments", queryString, adminPassword],
    queryFn: () =>
      fetchJson(`${API_URL}/api/appointments?${queryString}`, {
        headers: adminPassword ? { "x-admin-password": adminPassword } : {},
      }),
    enabled: isUnlocked,
  });

  useEffect(() => {
    if (error?.message?.toLowerCase().includes("unauthorized")) {
      setIsUnlocked(false);
      setAuthError("Invalid admin password.");
    }
  }, [error]);

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

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isUnlocked ? (
          <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur max-w-xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
              <CardTitle className="text-2xl">Admin Access</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="admin_password">Admin password</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Enter admin password"
                  className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                />
              </div>
              {authError && (
                <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                className="w-full bg-white/10 border border-white text-white hover:bg-white/20"
                onClick={() => {
                  if (!adminPassword.trim()) {
                    setAuthError("Please enter the admin password.");
                    return;
                  }
                  sessionStorage.setItem("admin_password", adminPassword.trim());
                  setAuthError("");
                  setIsUnlocked(true);
                }}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        ) : (
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
              <div className="md:col-span-2" />
              <div className="flex items-end gap-3">
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
                  onClick={() => {
                    sessionStorage.removeItem("admin_password");
                    setAdminPassword("");
                    setIsUnlocked(false);
                    setAuthError("");
                  }}
                >
                  Log out
                </Button>
              </div>
            </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

            {isLoading ? (
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
                        <td className="py-3 pr-4">{appointment.service_name || "—"}</td>
                        <td className="py-3 pr-4">{appointment.contact_email || "—"}</td>
                        <td className="py-3 pr-4">{appointment.contact_phone || "—"}</td>
                        <td className="py-3 pr-4">{appointment.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
