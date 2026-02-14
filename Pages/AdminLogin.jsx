import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { checkAdminSession, loginAdmin } from "@/api/adminClient";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [adminPassword, setAdminPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        await checkAdminSession();
        if (!cancelled) {
          navigate("/admin/appointments", { replace: true });
        }
      } catch {
        // no active admin session; stay on login page
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

  const handleSignIn = async () => {
    if (!adminPassword.trim()) {
      setAuthError("Please enter the admin password.");
      return;
    }

    setIsSigningIn(true);
    setAuthError("");

    try {
      await loginAdmin(adminPassword.trim());
      setAdminPassword("");
      navigate("/admin/appointments", { replace: true });
    } catch (error) {
      setAuthError(error.message || "Failed to sign in.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-36 md:pt-40 lg:pt-44 pb-16 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isCheckingSession ? (
          <Card className="border border-white/10 bg-white/5 shadow-xl backdrop-blur max-w-xl mx-auto">
            <CardContent className="p-6 space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : (
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSignIn();
                    }
                  }}
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
        )}
      </div>
    </div>
  );
}

