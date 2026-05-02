import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            Foodlink
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Вход
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Регистрация
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20 text-center">
        <div className="mb-6 inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Для ресторанов
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          Анкета ресторана
          <br />
          <span className="text-emerald-600">и меню для агрегаторов</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          Заполните данные о заведении, соберите меню с ценами для Яндекс Еды и
          Uzum Tezkor, скачайте PDF или архив с фотографиями.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all"
          >
            Зарегистрировать ресторан
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-200 bg-white px-8 py-3 text-base font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            Уже есть аккаунт
          </Link>
        </div>
      </main>
    </div>
  );
}
