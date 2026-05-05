"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function ExcelImport({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    categoriesCreated?: number;
    itemsCreated?: number;
    error?: string;
  } | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/import/${restaurantId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Ошибка загрузки" });
      } else {
        setResult({
          success: true,
          categoriesCreated: data.categoriesCreated,
          itemsCreated: data.itemsCreated,
        });
        router.refresh();
      }
    } catch {
      setResult({ error: "Ошибка сети" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/import/${restaurantId}/template`}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <svg
            className="h-5 w-5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Скачать шаблон Excel
        </a>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {uploading ? "Загрузка…" : "Загрузить файл"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </label>
      </div>

      {result && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            result.success
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.success ? (
            <div>
              <p className="font-medium">Импорт завершён успешно!</p>
              <p className="mt-1">
                Создано категорий: {result.categoriesCreated}, товаров:{" "}
                {result.itemsCreated}
              </p>
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
        <p className="font-medium">Как использовать:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-700">
          <li>Скачайте шаблон Excel с примерами</li>
          <li>Заполните данные о категориях и товарах</li>
          <li>Загрузите файл — категории и товары создадутся автоматически</li>
        </ol>
      </div>
    </div>
  );
}
