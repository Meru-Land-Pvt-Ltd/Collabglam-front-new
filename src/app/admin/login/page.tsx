// File: app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/adminbutton";
import { Label } from "@/components/ui/label";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { post } from "@/lib/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Call backend and store JWT in localStorage like other roles
      const data = await post<{
        token: string;
        admin: { adminId: string; email: string };
      }>("/admin/login", { email, password });

      // Use role-scoped token storage for admin
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminId", data.admin.adminId);
      localStorage.setItem("userType", "admin");
      localStorage.setItem("userEmail", data.admin.email || email);

      router.replace("/admin/brands");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#fafafa] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-black/10 rounded-2xl p-6 space-y-4"
      >
        <div>
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="text-sm text-black/60">Sign in to continue</p>
        </div>

        {error ? (
          <div className="text-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@collabglam.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">
            Password
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full border border-black/10 rounded-lg px-3 py-2 pr-10 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <HiEyeSlash /> : <HiEye />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}