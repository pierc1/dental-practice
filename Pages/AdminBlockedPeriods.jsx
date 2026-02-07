import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }
  return payload;
};

const fetchAdminJson = (url, options = {}) => {
  const mergedHeaders = { ...(options.headers || {}) };
  return fetchJson(url, {
    ...options,
    credentials: "include",
    headers: mergedHeaders,
  });
};

export default function AdminBlockedPeriods() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adminPassword, setAdminPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [blockError, setBlockError] = useState("");
  const [filters, setFilters] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
  });
  const [blockForm, setBlockForm] = useState({
    startTime: "",
    endTime: "",
    reason: "",
  });

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        await fetchAdminJson(`${API_URL}/api/admin/session`);
        if (!cancelled) {
          setIsUnlocked(true);
          setAuthError("");
        }
      } catch {
        if (!cancelled) {
          setIsUnlocked(false);
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
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("start", filters.startDate);
    if (filters.endDate) params.set("end", filters.endDate);
    params.set("limit", "200");
    return params.toString();
  }, [filters]);

  const {
    data: blockedPeriods = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blocked-periods", queryString, isUnlocked],
    queryFn: () => fetchAdminJson(`${API_URL}/api/blocked-periods?${queryString}`),
    enabled: isUnlocked,
  });

  useEffect(() => {
    if (error?.message?.toLowerCase().includes("unauthorized")) {
      setIsUnlocked(false);
      setAuthError("Session expired. Please sign in again.");
    }
  }, [error]);

  const createBlockedPeriodMutation = useMutation({
    mutationFn: (payload) =>
      fetchAdminJson(`${API_URL}/api/blocked-periods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setBlockError("");
      setBlockForm({ startTime: "", endTime: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["blocked-periods"] });
    },
    onError: (mutationError) => {
      if (mutationError?.message?.toLowerCase().includes("unauthorized")) {
        setIsUnlocked(false);
        setAuthError("Session expired. Please sign in again.");
        return;
      }
      setBlockError(mutationError.message || "Failed to create blocked period.");
    },
  });

  const deleteBlockedPeriodMutation = useMutation({
    mutationFn: (id) =>
      fetchAdminJson(`${API_URL}/api/blocked-periods/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-periods"] });
    },
    onError: (mutationError) => {
      if (mutationError?.message?.toLowerCase().includes("unauthorized")) {
        setIsUnlocked(false);
        setAuthError("Session expired. Please sign in again.");
        return;
      }
      setBlockError(mutationError.message || "Failed to delete blocked period.");
    },
  });

  const handleSignIn = async () => {
    if (!adminPassword.trim()) {
      setAuthError("Please enter the admin password.");
      return;
    }

    setIsSigningIn(true);
    setAuthError("");

    try {
      await fetchAdminJson(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword.trim() }),
      });
      setIsUnlocked(true);
      setAdminPassword("");
      setAuthError("");
    } catch (signInError) {
      setAuthError(signInError.message || "Failed to sign in.");
      setIsUnlocked(false);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchAdminJson(`${API_URL}/api/admin/logout`, { method: "POST" });
    } catch {
      // best-effort logout
    }

    setIsUnlocked(false);
    setAdminPassword("");
    setAuthError("");
    navigate("/admin/appointments");
  };

  const handleCreateBlockedPeriod = () => {
    setBlockError("");

    const parsedStart = new Date(blockForm.startTime);
    const parsedEnd = new Date(blockForm.endTime);

    if (!blockForm.startTime || Number.isNaN(parsedStart.getTime())) {
      setBlockError("Please enter a valid block start time.");
      return;
    }

    if (!blockForm.endTime || Number.isNaN(parsedEnd.getTime())) {
      setBlockError("Please enter a valid block end time.");
      return;
    }

    if (parsedEnd <= parsedStart) {
      setBlockError("End time must be after start time.");
      return;
    }

    createBlockedPeriodMutation.mutate({
      startTime: parsedStart.toISOString(),
      endTime: parsedEnd.toISOString(),
      reason: blockForm.reason.trim() || null,
    });
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                onClick={handleSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? "Signing in..." : "Continue"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
              <CardTitle className="text-2xl">Blocked Time Manager</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="bg-white/10 border border-white text-white hover:bg-white/20"
                  onClick={() => navigate("/admin/appointments")}
                >
                  Back to appointments
                </Button>
                <Button
                  type="button"
                  className="bg-transparent border border-white/40 text-white hover:bg-white/10"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter_start">Start date</Label>
                  <Input
                    id="filter_start"
                    type="date"
                    value={filters.startDate}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, startDate: event.target.value }))
                    }
                    className="mt-2 bg-white border-slate-300 text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="filter_end">End date</Label>
                  <Input
                    id="filter_end"
                    type="date"
                    value={filters.endDate}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, endDate: event.target.value }))
                    }
                    className="mt-2 bg-white border-slate-300 text-black"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="block_start">Start</Label>
                  <Input
                    id="block_start"
                    type="datetime-local"
                    value={blockForm.startTime}
                    onChange={(event) =>
                      setBlockForm((current) => ({ ...current, startTime: event.target.value }))
                    }
                    className="mt-2 bg-white border-slate-300 text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="block_end">End</Label>
                  <Input
                    id="block_end"
                    type="datetime-local"
                    value={blockForm.endTime}
                    onChange={(event) =>
                      setBlockForm((current) => ({ ...current, endTime: event.target.value }))
                    }
                    className="mt-2 bg-white border-slate-300 text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="block_reason">Reason (optional)</Label>
                  <Input
                    id="block_reason"
                    value={blockForm.reason}
                    onChange={(event) =>
                      setBlockForm((current) => ({ ...current, reason: event.target.value }))
                    }
                    placeholder="Lunch, provider out, meeting"
                    className="mt-2 bg-white border-slate-300 text-black placeholder:text-slate-500"
                  />
                </div>
              </div>

              {blockError && (
                <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                  <AlertDescription>{blockError}</AlertDescription>
                </Alert>
              )}

              {error && !error.message?.toLowerCase().includes("unauthorized") && (
                <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                className="bg-white/10 border border-white text-white hover:bg-white/20"
                onClick={handleCreateBlockedPeriod}
                disabled={createBlockedPeriodMutation.isPending}
              >
                {createBlockedPeriodMutation.isPending ? "Blocking..." : "Block time range"}
              </Button>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : blockedPeriods.length === 0 ? (
                <p className="text-slate-300">No blocked periods for this date range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-200">
                    <thead className="text-xs uppercase text-slate-300 border-b border-white/10">
                      <tr>
                        <th className="py-3 pr-4">Start</th>
                        <th className="py-3 pr-4">End</th>
                        <th className="py-3 pr-4">Reason</th>
                        <th className="py-3 pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedPeriods.map((period) => (
                        <tr key={period.id} className="border-b border-white/5">
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {format(new Date(period.start_time), "MMM d, yyyy h:mm a")}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {format(new Date(period.end_time), "MMM d, yyyy h:mm a")}
                          </td>
                          <td className="py-3 pr-4">{period.reason || "-"}</td>
                          <td className="py-3 pr-4">
                            <Button
                              type="button"
                              className="bg-transparent border border-white/40 text-white hover:bg-white/10"
                              disabled={deleteBlockedPeriodMutation.isPending}
                              onClick={() => deleteBlockedPeriodMutation.mutate(period.id)}
                            >
                              Remove
                            </Button>
                          </td>
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
