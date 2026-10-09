import { ShieldX } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AccessDenied() {

  const handleLogin = async () => {
    localStorage.clear();
    sessionStorage.clear();

    await base44.auth.logout("/");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(217,91%,18%)] to-[hsl(215,60%,32%)] p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">

        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-red-600 mb-3">
          Access Denied
        </h1>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You are not an authorized user of GSI Stock Management.
          <br />
          Please contact your administrator for access.
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}