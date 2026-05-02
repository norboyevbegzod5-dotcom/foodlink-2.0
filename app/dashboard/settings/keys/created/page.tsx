import Link from "next/link";

export default async function KeyCreatedPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Ключ создан</h1>
      <p className="mt-2 text-sm text-red-700">
        Скопируйте ключ сейчас. Позже он будет недоступен в открытом виде.
      </p>
      {key ? (
        <pre className="mt-6 overflow-x-auto rounded-xl border border-amber-200 bg-amber-50 p-4 font-mono text-sm text-zinc-900">
          {key}
        </pre>
      ) : (
        <p className="mt-4 text-sm text-zinc-600">Ключ не передан.</p>
      )}
      <Link
        href="/dashboard/settings/keys"
        className="mt-8 inline-block text-sm font-medium text-amber-800 underline"
      >
        К списку ключей
      </Link>
    </div>
  );
}
