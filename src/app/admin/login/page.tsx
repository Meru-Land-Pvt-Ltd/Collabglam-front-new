"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/adminbutton";
import { Label } from "@/components/ui/label";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { post } from "@/lib/api";

type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
};

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
      const data = await post<{
        token: string;
        admin: AdminUser;
      }>("/admins/login", { email, password });

      const admin = data?.admin;

      if (!data?.token || !admin?._id) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("adminId", admin._id);
      localStorage.setItem("userType", "admin");
      localStorage.setItem("userEmail", admin.email || email);

      // Needed for revenue_head UI logic
      localStorage.setItem("adminRole", admin.role || "");
      localStorage.setItem("admin", JSON.stringify(admin));

      // Optional convenience keys
      if (admin.name) localStorage.setItem("adminName", admin.name);
      if (admin.status) localStorage.setItem("adminStatus", admin.status);

      router.replace("/admin/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Oops! We couldn't sign you in. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 relative">
            <Image
              src="/logo.png"
              alt="Admin Logo"
              fill
              className="object-contain"
            />
          </div>

          <CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
          <CardDescription className="text-gray-500">
            Please enter your admin credentials
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                  autoComplete="current-password"
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

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              type="submit"
              className="w-full py-2 text-lg"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}