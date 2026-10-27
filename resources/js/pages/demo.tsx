import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

type Category = { id: number; name: string; slug: string };
type Tag = { id: number; name: string; slug: string };
type Profile = { id: number; phone: string | null; address: string | null };

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string | number;
    stock: number;
    is_active: boolean;
    category?: Category | null;
    tags?: Tag[];
};

type User = {
    id: number;
    name: string;
    email: string;
    profile?: Profile | null;
};

type SocketEvent = {
    source: 'product' | 'user';
    action: string;
    title: string;
    detail: string;
    changed_at: string;
};

type ApiList<T> = { data: T[] };

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500';
const buttonClass =
    'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50';

async function api<T>(
    path: string,
    options: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: T }> {
    const response = await fetch(path, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    });

    const body = (
        response.status === 204 ? {} : await response.json()
    ) as T;

    return { ok: response.ok, status: response.status, body };
}

function validationMessage(body: unknown): string {
    if (
        typeof body === 'object' &&
        body !== null &&
        'errors' in body &&
        body.errors
    ) {
        return Object.values(
            body.errors as Record<string, string[]>,
        )
            .flat()
            .join(' ');
    }

    if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
    ) {
        return body.message;
    }

    return 'Запрос не выполнен';
}

export default function Demo() {
    const [tab, setTab] = useState<'products' | 'users' | 'catalog'>(
        'products',
    );
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [events, setEvents] = useState<SocketEvent[]>([]);

    
    
    const emptyProduct = {
        category_id: '',
        name: '',
        slug: '',
        description: '',
        price: '',
        stock: '0',
        is_active: true,
        tag_ids: [] as number[],
    };

    const emptyUser = {
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
    };

    const emptyCategory = { name: '', slug: '', description: '' };
    const emptyTag = { name: '', slug: '' };

    const [productForm, setProductForm] = useState(emptyProduct);
    const [userForm, setUserForm] = useState(emptyUser);
    const [categoryForm, setCategoryForm] = useState(emptyCategory);
    const [tagForm, setTagForm] = useState(emptyTag);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [productRes, categoryRes, tagRes, userRes] =
                await Promise.all([
                    api<ApiList<Product>>('/api/products'),
                    api<ApiList<Category>>('/api/categories'),
                    api<ApiList<Tag>>('/api/tags'),
                    api<ApiList<User>>('/api/users'),
                ]);

            if (
                !productRes.ok ||
                !categoryRes.ok ||
                !tagRes.ok ||
                !userRes.ok
            ) {
                throw new Error('Не удалось загрузить данные API');
            }

            setProducts(productRes.body.data);
            setCategories(categoryRes.body.data);
            setTags(tagRes.body.data);
            setUsers(userRes.body.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Не удалось загрузить данные',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    function slugFrom(value: string): string {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9а-яё]+/gi, '-')
            .replace(/^-|-$/g, '');
    }

    async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        const payload = {
            ...productForm,
            category_id: Number(productForm.category_id),
            price: Number(productForm.price),
            stock: Number(productForm.stock),
        };

        const result = await api(
            editingId ? `/api/products/${editingId}` : '/api/products',
            {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            },
        );

        setSaving(false);

        if (!result.ok) {
            setError(validationMessage(result.body));
            return;
        }

        setMessage(editingId ? 'Товар обновлён' : 'Товар создан');
        setProductForm(emptyProduct);
        setEditingId(null);
        await loadAll();
    }

    async function saveUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        const payload: Record<string, unknown> = {
            name: userForm.name,
            email: userForm.email,
            profile: {
                phone: userForm.phone || null,
                address: userForm.address || null,
            },
        };

        if (userForm.password) {
            payload.password = userForm.password;
        }

        const result = await api('/api/users', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        setSaving(false);

        if (!result.ok) {
            setError(validationMessage(result.body));
            return;
        }

        setMessage('Пользователь создан, событие ушло в сокет');
        setUserForm(emptyUser);
        await loadAll();
    }

    async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        const result = await api('/api/categories', {
            method: 'POST',
            body: JSON.stringify(categoryForm),
        });

        setSaving(false);

        if (!result.ok) {
            setError(validationMessage(result.body));
            return;
        }

        setMessage('Категория создана');
        setCategoryForm(emptyCategory);
        await loadAll();
    }

    async function saveTag(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        const result = await api('/api/tags', {
            method: 'POST',
            body: JSON.stringify(tagForm),
        });

        setSaving(false);

        if (!result.ok) {
            setError(validationMessage(result.body));
            return;
        }

        setMessage('Тег создан');
        setTagForm(emptyTag);
        await loadAll();
    }

    async function remove(path: string, success: string) {
        if (!window.confirm('Удалить запись?')) {
            return;
        }

        const result = await api(path, { method: 'DELETE' });

        if (!result.ok) {
            setError(validationMessage(result.body));
            return;
        }

        setMessage(success);
        await loadAll();
    }

    return (
        <main className="min-h-screen bg-slate-50 p-5 text-slate-900 sm:p-10">
            <Head title="Демо CRUD" />
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-indigo-600">
                            <Link href="/" className="hover:underline">
                                На главную
                            </Link>
                            {' · '}
                            <a href="/docs/api" className="hover:underline">
                                Swagger / Scramble
                            </a>
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">
                            SHOP TEST
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadAll()}
                        disabled={loading}
                        className={`${buttonClass} border border-slate-200 hover:bg-slate-50`}
                    >
                        {loading ? 'Загрузка...' : 'Обновить данные'}
                    </button>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold">
                                Активность
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Laravel Reverb, каналы products и users. Создайте
                                товар или пользователя, чтобы увидеть событие.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEvents([])}
                            className={`${buttonClass} border border-slate-200 hover:bg-slate-50`}
                        >
                            Очистить журнал
                        </button>
                    </div>

                    <div className="mt-4 space-y-2">
                        {events.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                Ожидание событий.
                            </p>
                        ) : (
                            events.map((event, index) => (
                                <div
                                    key={`${event.source}-${event.changed_at}-${index}`}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold">
                                            {event.source === 'product'
                                                ? 'Товар'
                                                : 'Пользователь'}
                                        </span>
                                        <span
                                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                                event.action === 'created'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : event.action === 'deleted'
                                                      ? 'bg-red-100 text-red-700'
                                                      : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {event.action}
                                        </span>
                                        <span className="font-medium">
                                            {event.title}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-500">
                                            {new Date(
                                                event.changed_at,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-slate-500">
                                        {event.detail}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        role="status"
                        className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
                    >
                        {message}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            ['products', 'Товары'],
                            ['users', 'Пользователи'],
                            ['catalog', 'Категории и теги'],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={`${buttonClass} ${
                                tab === id
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'products' && (
                    <>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                {editingId
                                    ? `Редактирование товара #${editingId}`
                                    : 'Создать товар'}
                            </h2>
                            <form
                                onSubmit={(event) => void saveProduct(event)}
                                className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                <label className="space-y-1.5 text-sm font-medium">
                                    Категория *
                                    <select
                                        className={inputClass}
                                        required
                                        value={productForm.category_id}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                category_id: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            Выберите категорию
                                        </option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Название *
                                    <input
                                        className={inputClass}
                                        required
                                        value={productForm.name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setProductForm((previous) => ({
                                                ...previous,
                                                name,
                                                slug: editingId
                                                    ? previous.slug
                                                    : slugFrom(name),
                                            }));
                                        }}
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Slug *
                                    <input
                                        className={inputClass}
                                        required
                                        value={productForm.slug}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                slug: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Цена *
                                    <input
                                        className={inputClass}
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={productForm.price}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                price: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Остаток
                                    <input
                                        className={inputClass}
                                        type="number"
                                        min="0"
                                        value={productForm.stock}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                stock: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Теги (многие ко многим)
                                    <select
                                        multiple
                                        className={inputClass}
                                        value={productForm.tag_ids.map(String)}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                tag_ids: Array.from(
                                                    e.target.selectedOptions,
                                                    (option) =>
                                                        Number(option.value),
                                                ),
                                            }))
                                        }
                                    >
                                        {tags.map((tag) => (
                                            <option
                                                key={tag.id}
                                                value={tag.id}
                                            >
                                                {tag.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
                                    Описание
                                    <textarea
                                        className={inputClass}
                                        rows={3}
                                        value={productForm.description}
                                        onChange={(e) =>
                                            setProductForm((previous) => ({
                                                ...previous,
                                                description: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                                    >
                                        {saving
                                            ? 'Сохранение...'
                                            : editingId
                                              ? 'Сохранить'
                                              : 'Создать товар'}
                                    </button>
                                    {editingId !== null && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProductForm(emptyProduct);
                                                setEditingId(null);
                                            }}
                                            className={`${buttonClass} border border-slate-200`}
                                        >
                                            Отмена
                                        </button>
                                    )}
                                </div>
                            </form>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Товары</h2>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-3 py-3">ID</th>
                                            <th className="px-3 py-3">Товар</th>
                                            <th className="px-3 py-3">
                                                Категория
                                            </th>
                                            <th className="px-3 py-3">Цена</th>
                                            <th className="px-3 py-3">Теги</th>
                                            <th className="px-3 py-3">
                                                Действия
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr
                                                key={product.id}
                                                className="border-b border-slate-100"
                                            >
                                                <td className="px-3 py-4">
                                                    {product.id}
                                                </td>
                                                <td className="px-3 py-4 font-medium">
                                                    {product.name}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {product.category?.name ??
                                                        '—'}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {Number(
                                                        product.price,
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {product.tags
                                                        ?.map((tag) => tag.name)
                                                        .join(', ') || '—'}
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            className={`${buttonClass} border border-slate-200`}
                                                            onClick={() => {
                                                                setEditingId(
                                                                    product.id,
                                                                );
                                                                setProductForm({
                                                                    category_id:
                                                                        String(
                                                                            product
                                                                                .category
                                                                                ?.id ??
                                                                                '',
                                                                        ),
                                                                    name: product.name,
                                                                    slug: product.slug,
                                                                    description:
                                                                        product.description ??
                                                                        '',
                                                                    price: String(
                                                                        product.price,
                                                                    ),
                                                                    stock: String(
                                                                        product.stock,
                                                                    ),
                                                                    is_active:
                                                                        product.is_active,
                                                                    tag_ids: (
                                                                        product.tags ??
                                                                        []
                                                                    ).map(
                                                                        (tag) =>
                                                                            tag.id,
                                                                    ),
                                                                });
                                                            }}
                                                        >
                                                            Изменить
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`${buttonClass} bg-red-50 text-red-700`}
                                                            onClick={() =>
                                                                void remove(
                                                                    `/api/products/${product.id}`,
                                                                    'Товар удалён',
                                                                )
                                                            }
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {tab === 'users' && (
                    <>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                Создать пользователя и профиль
                            </h2>
                            <form
                                onSubmit={(event) => void saveUser(event)}
                                className="mt-5 grid gap-4 sm:grid-cols-2"
                            >
                                <label className="space-y-1.5 text-sm font-medium">
                                    Имя *
                                    <input
                                        className={inputClass}
                                        required
                                        value={userForm.name}
                                        onChange={(e) =>
                                            setUserForm((previous) => ({
                                                ...previous,
                                                name: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Email *
                                    <input
                                        className={inputClass}
                                        required
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) =>
                                            setUserForm((previous) => ({
                                                ...previous,
                                                email: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Пароль *
                                    <input
                                        className={inputClass}
                                        required
                                        type="password"
                                        minLength={8}
                                        value={userForm.password}
                                        onChange={(e) =>
                                            setUserForm((previous) => ({
                                                ...previous,
                                                password: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium">
                                    Телефон
                                    <input
                                        className={inputClass}
                                        value={userForm.phone}
                                        onChange={(e) =>
                                            setUserForm((previous) => ({
                                                ...previous,
                                                phone: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                                    Адрес
                                    <input
                                        className={inputClass}
                                        value={userForm.address}
                                        onChange={(e) =>
                                            setUserForm((previous) => ({
                                                ...previous,
                                                address: e.target.value,
                                            }))
                                        }
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                                >
                                    Создать пользователя
                                </button>
                            </form>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">
                                Пользователи
                            </h2>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-3 py-3">ID</th>
                                            <th className="px-3 py-3">Имя</th>
                                            <th className="px-3 py-3">Email</th>
                                            <th className="px-3 py-3">
                                                Профиль
                                            </th>
                                            <th className="px-3 py-3">
                                                Действия
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b border-slate-100"
                                            >
                                                <td className="px-3 py-4">
                                                    {user.id}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {user.name}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {user.email}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {user.profile?.phone ||
                                                        '—'}
                                                    {user.profile?.address
                                                        ? ` · ${user.profile.address}`
                                                        : ''}
                                                </td>
                                                <td className="px-3 py-4">
                                                    <button
                                                        type="button"
                                                        className={`${buttonClass} bg-red-50 text-red-700`}
                                                        onClick={() =>
                                                            void remove(
                                                                `/api/users/${user.id}`,
                                                                'Пользователь удалён',
                                                            )
                                                        }
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {tab === 'catalog' && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Категории</h2>
                            <form
                                onSubmit={(event) => void saveCategory(event)}
                                className="mt-4 space-y-3"
                            >
                                <input
                                    className={inputClass}
                                    required
                                    placeholder="Название"
                                    value={categoryForm.name}
                                    onChange={(e) =>
                                        setCategoryForm((previous) => ({
                                            ...previous,
                                            name: e.target.value,
                                            slug: slugFrom(e.target.value),
                                        }))
                                    }
                                />
                                <input
                                    className={inputClass}
                                    required
                                    placeholder="slug"
                                    value={categoryForm.slug}
                                    onChange={(e) =>
                                        setCategoryForm((previous) => ({
                                            ...previous,
                                            slug: e.target.value,
                                        }))
                                    }
                                />
                                <button
                                    type="submit"
                                    className={`${buttonClass} bg-indigo-600 text-white`}
                                >
                                    Добавить категорию
                                </button>
                            </form>
                            <ul className="mt-4 space-y-2 text-sm">
                                {categories.map((category) => (
                                    <li
                                        key={category.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                                    >
                                        <span>
                                            {category.name}{' '}
                                            <span className="text-slate-400">
                                                {category.slug}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            className="text-red-600"
                                            onClick={() =>
                                                void remove(
                                                    `/api/categories/${category.id}`,
                                                    'Категория удалена',
                                                )
                                            }
                                        >
                                            Удалить
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold">Теги</h2>
                            <form
                                onSubmit={(event) => void saveTag(event)}
                                className="mt-4 space-y-3"
                            >
                                <input
                                    className={inputClass}
                                    required
                                    placeholder="Название"
                                    value={tagForm.name}
                                    onChange={(e) =>
                                        setTagForm((previous) => ({
                                            ...previous,
                                            name: e.target.value,
                                            slug: slugFrom(e.target.value),
                                        }))
                                    }
                                />
                                <input
                                    className={inputClass}
                                    required
                                    placeholder="slug"
                                    value={tagForm.slug}
                                    onChange={(e) =>
                                        setTagForm((previous) => ({
                                            ...previous,
                                            slug: e.target.value,
                                        }))
                                    }
                                />
                                <button
                                    type="submit"
                                    className={`${buttonClass} bg-indigo-600 text-white`}
                                >
                                    Добавить тег
                                </button>
                            </form>
                            <ul className="mt-4 space-y-2 text-sm">
                                {tags.map((tag) => (
                                    <li
                                        key={tag.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                                    >
                                        <span>{tag.name}</span>
                                        <button
                                            type="button"
                                            className="text-red-600"
                                            onClick={() =>
                                                void remove(
                                                    `/api/tags/${tag.id}`,
                                                    'Тег удалён',
                                                )
                                            }
                                        >
                                            Удалить
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}
