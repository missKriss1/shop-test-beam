import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Shop Test Beam" />
            <main className="min-h-screen bg-slate-50 p-6 text-slate-900 sm:p-10">
                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h1 className="mt-2 text-3xl font-bold">Shop Test Beam</h1>
                    <p className="mt-3 text-slate-600">
                        Демо-приложение: сущности магазина, связи
                        Eloquent, REST API со Swagger-документацией и уведомления
                        через Laravel Reverb (протокол Pusher).
                    </p>

                    <ul className="mt-6 space-y-2 text-sm text-slate-700">
                        <li>Один к одному: пользователь → профиль</li>
                        <li>Один ко многим: категория → товары</li>
                        <li>Многие к одному: товар → категория</li>
                        <li>Многие ко многим: товары ↔ теги</li>
                    </ul>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/demo"
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            Демо-страница CRUD
                        </Link>
                        <a
                            href="/docs/api"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                            Документация API
                        </a>
                    </div>
                </div>
            </main>
        </>
    );
}
