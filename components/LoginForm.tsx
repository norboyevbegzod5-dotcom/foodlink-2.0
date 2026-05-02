"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors";

export function LoginForm({ authError }: { authError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Вход в Foodlink</h1>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
          {(authError || message) && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {authError
                ? "Ошибка подтверждения. Попробуйте войти снова."
                : message}
            </p>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Пароль</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
            >
              {loading ? "Вход…" : "Войти"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-500">
            Нет аккаунта?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Регистрация
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
            На главную
          </Link>
        </p>
      </div>
    </div>
  );
}
