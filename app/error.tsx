"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold text-zinc-900">Что-то пошло не так</h1>
      <p className="max-w-md text-center text-sm text-zinc-600">
        Произошла непредвиденная ошибка. Попробуйте обновить страницу.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Повторить
      </button>
    </div>
  );
}
