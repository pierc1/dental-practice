import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { checkAdminSession, fetchAdminJson, getApiUrl, logoutAdmin } from "@/api/adminClient";

const DEFAULT_BLOCK_START_TIME = "09:00";
const DEFAULT_BLOCK_END_TIME = "17:00";

export default function AdminBlockedPeriods() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [blockError, setBlockError] = useState("");
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [filters, setFilters] = useState({
    startDate: todayKey,
    endDate: todayKey,
  });
  const [blockForm, setBlockForm] = useState({
    startTime: DEFAULT_BLOCK_START_TIME,
    endTime: DEFAULT_BLOCK_END_TIME,
    reason: "",
  });

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
    queryFn: () => fetchAdminJson(getApiUrl(`/api/blocked-periods?${queryString}`)),
    enabled: isUnlocked,
  });

  useEffect(() => {
    if (error?.message?.toLowerCase().includes("unauthorized")) {
      setIsUnlocked(false);
      navigate("/admin", { replace: true });
    }
  }, [error, navigate]);

  const displayErrorMessage =
    blockError ||
    (error && !error.message?.toLowerCase().includes("unauthorized")
      ? error.message
      : "");

  const createBlockedPeriodMutation = useMutation({
    mutationFn: (payload) =>
      fetchAdminJson(getApiUrl("/api/blocked-periods"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setBlockError("");
      setBlockForm({
        startTime: DEFAULT_BLOCK_START_TIME,
        endTime: DEFAULT_BLOCK_END_TIME,
        reason: "",
      });
      queryClient.invalidateQueries({ queryKey: ["blocked-periods"] });
    },
    onError: (mutationError) => {
      if (mutationError?.message?.toLowerCase().includes("unauthorized")) {
        setIsUnlocked(false);
        navigate("/admin", { replace: true });
        return;
      }
      setBlockError(mutationError.message || "Failed to create blocked period.");
    },
  });

  const deleteBlockedPeriodMutation = useMutation({
    mutationFn: (id) =>
      fetchAdminJson(getApiUrl(`/api/blocked-periods/${id}`), {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-periods"] });
    },
    onError: (mutationError) => {
      if (mutationError?.message?.toLowerCase().includes("unauthorized")) {
        setIsUnlocked(false);
        navigate("/admin", { replace: true });
        return;
      }
      setBlockError(mutationError.message || "Failed to delete blocked period.");
    },
  });

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

  const handleCreateBlockedPeriod = () => {
    setBlockError("");

    if (!filters.startDate || !filters.endDate) {
      setBlockError("Please select start and end dates.");
      return;
    }

    if (!blockForm.startTime) {
      setBlockError("Please enter a valid block start time.");
      return;
    }

    if (!blockForm.endTime) {
      setBlockError("Please enter a valid block end time.");
      return;
    }

    const parsedStart = new Date(`${filters.startDate}T${blockForm.startTime}:00`);
    const parsedEnd = new Date(`${filters.endDate}T${blockForm.endTime}:00`);

    if (Number.isNaN(parsedStart.getTime())) {
      setBlockError("Please enter a valid block start date/time.");
      return;
    }

    if (Number.isNaN(parsedEnd.getTime())) {
      setBlockError("Please enter a valid block end date/time.");
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

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Label htmlFor="block_start_time">Start time</Label>
                <Input
                  id="block_start_time"
                  type="time"
                  value={blockForm.startTime}
                  onChange={(event) =>
                    setBlockForm((current) => ({ ...current, startTime: event.target.value }))
                  }
                  className="mt-2 bg-white border-slate-300 text-black"
                />
              </div>
              <div>
                <Label htmlFor="block_end_time">End time</Label>
                <Input
                  id="block_end_time"
                  type="time"
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

            {displayErrorMessage && (
              <Alert variant="destructive" className="bg-red-500/10 text-white border-red-500/30">
                <AlertDescription>{displayErrorMessage}</AlertDescription>
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
      </div>
    </div>
  );
}

