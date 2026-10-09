import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";
import * as auth from "@/lib/auth";
import { base44 } from "@/api/base44Client";

const NOT_SET_UP = "Your account is not set up in GSI Stock Management. Please contact your Admin.";

// Ask the backend who this login is (userdetails), store the display profile, go to the app.
async function validateAndEnter() {
  const res = await base44.functions.invoke("validateUser", {});
  const { valid, profile } = res.data || {};
  if (!valid) return false;
  localStorage.setItem("gsiUser", JSON.stringify({
    userId: profile?.userId || null,
    employeeId: profile?.employeeId || null,
    username: profile?.username || null,
    role: profile?.role || null,
    team: profile?.team || null,
  })); // display-only cache; the server re-checks identity on every call
  window.location.href = "/dashboard";
  return true;
}

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice] = useState(() => {
    const m = sessionStorage.getItem("storeLoginMessage") || "";
    sessionStorage.removeItem("storeLoginMessage");
    return m;
  });

  const switchMode = (m) => { setMode(m); setError(""); setShowOtp(false); setCode(""); };

  const denyAndSignOut = async () => {
    try { await auth.signOut(); } catch { /* ignore */ }
    localStorage.removeItem("gsiUser");
    setError(NOT_SET_UP);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await auth.signIn(email, password);
    } catch (err) {
      const unconfirmed = /not confirmed/i.test(err?.message || "") || String(err?.code || "").includes("email_not_confirmed");
      setError(unconfirmed ? "Please verify your email first. Use Sign Up to receive a new code." : "Invalid email or password");
      setLoading(false);
      return;
    }
    try {
      if (!(await validateAndEnter())) await denyAndSignOut();
    } catch {
      setError("Unable to verify your access. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try { await auth.signUp(email, password); setShowOtp(true); }
    catch (err) { setError(err.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError(""); setLoading(true);
    try { await auth.verifySignupCode(email, code); }
    catch { setError("Invalid verification code"); setLoading(false); return; }
    try {
      if (!(await validateAndEnter())) await denyAndSignOut();
    } catch {
      setError("Unable to verify your access. Please try again.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError("");
    try { await auth.resendSignupCode(email); toast.success("Code sent — check your email."); }
    catch (err) { setError(err.message || "Failed to resend code"); }
  };

  const title = <>GSI Stock <span className="whitespace-nowrap">Management</span></>;

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12" onClick={handleVerify} disabled={loading || code.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify code"}
        </Button>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <button type="button" className="font-medium text-primary hover:underline" onClick={handleResend}>Resend code</button>
          <button type="button" className="text-muted-foreground hover:underline" onClick={() => setShowOtp(false)}>Back</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Building2} title={title} subtitle="Galaxy Studio Interior — Store & Materials">
      {notice && <div className="mb-4 p-3 rounded-lg bg-accent text-accent-foreground text-sm">{notice}</div>}
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-6">
        {["login", "signup"].map((m) => (
          <button key={m} type="button" onClick={() => switchMode(m)}
            className={`h-9 rounded-lg text-sm font-medium transition ${mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
            {m === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Office email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="name@galaxystudio.net"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
        )}
        {mode === "login" && (
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
        )}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{mode === "login" ? "Logging in..." : "Creating account..."}</>
            : mode === "login" ? "Log In" : "Sign Up"}
        </Button>
      </form>
      {mode === "signup" && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Use your office email. Create a new password for this app (not your email password).
        </p>
      )}
    </AuthLayout>
  );
}
