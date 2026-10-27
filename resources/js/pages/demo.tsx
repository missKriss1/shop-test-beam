import { useCallback, useEffect, useState } from 'react';
import { useEchoPublic } from '@laravel/echo-react';

type Category = { id: number; name: string };
type Tag = { id: number; name: string };

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

type ProductEvent = {
    action: string;
    product: {
        id: number;
        name: string;
        slug: string;
        price: string | number;
        stock: number;
    };
    changed_at: string;
};

type ApiList<T> = { data: T[] };

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500';

const buttonClass =
    'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50';

export default function Demo() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [events, setEvents] = useState<ProductEvent[]>([]);

    useEchoPublic<ProductEvent>(
        'products',
        '.product.changed',
        (event) => {
            setEvents((previous) => [event, ...previous].slice(0, 10));
        },
    );

    const emptyForm = {
        category_id: '',
        name: '',
        slug: '',
        description: '',
        price: '',
        stock: '0',
        is_active: true,
        tag_ids: [] as number[],
    };

    const [form, setForm] = useState(emptyForm);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/products', {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }

            const result: ApiList<Product> = await response.json();
            setProducts(result.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Не удалось загрузить товары',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const loadOptions = useCallback(async () => {
        try {
            const [categoryResponse, tagResponse] = await Promise.all([
                fetch('/api/categories', {
                    headers: { Accept: 'application/json' },
                }),
                fetch('/api/tags', {
                    headers: { Accept: 'application/json' },
                }),
            ]);

            if (!categoryResponse.ok || !tagResponse.ok) {
                throw new Error('Не удалось загрузить категории или теги');
            }

            const categoryResult: ApiList<Category> =
                await categoryResponse.json();
            const tagResult: ApiList<Tag> = await tagResponse.json();

            setCategories(categoryResult.data);
            setTags(tagResult.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Ошибка загрузки справочников',
            );
        }
    }, []);

    useEffect(() => {
        void loadProducts();
        void loadOptions();
    }, [loadProducts, loadOptions]);

    function updateField<K extends keyof typeof emptyForm>(
        key: K,
        value: (typeof emptyForm)[K],
    ) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }

    async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        const payload = {
            ...form,
            category_id: Number(form.category_id),
            price: Number(form.price),
            stock: Number(form.stock),
        };

        try {
            const response = await fetch(
                editingId ? `/api/products/${editingId}` : '/api/products',
                {
                    method: editingId ? 'PUT' : 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json();

            if (!response.ok) {
                const details = result.errors
                    ? Object.values(result.errors).flat().join(' ')
                    : result.message;

                throw new Error(details || 'Не удалось сохранить товар');
            }

            setMessage(editingId ? 'Товар обновлён' : 'Товар создан');
            resetForm();
            await loadProducts();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Ошибка сохранения',
            );
        } finally {
            setSaving(false);
        }
    }

    function editProduct(product: Product) {
        setEditingId(product.id);
        setForm({
            category_id: String(product.category?.id ?? ''),
            name: product.name,
            slug: product.slug,
            description: product.description ?? '',
            price: String(product.price),
            stock: String(product.stock),
            is_active: product.is_active,
            tag_ids: (product.tags ?? []).map((tag) => tag.id),
        });
        setMessage('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteProduct(product: Product) {
        if (!window.confirm(`Удалить товар «${product.name}»?`)) return;

        setError('');
        setMessage('');

        try {
            const response = await fetch(`/api/products/${product.id}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Ошибка удаления: ${response.status}`);
            }

            if (editingId === product.id) resetForm();

            setMessage('Товар удалён');
            await loadProducts();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Не удалось удалить товар',
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 p-5 text-slate-900 sm:p-10">
            <div className="mx-auto max-w-7xl space-y-6">
                <header>
                    <h1 className="mt-2 text-3xl font-bold">
                        Shop Test
                    </h1>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold">
                                События в реальном времени
                            </h2>
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
                                Ожидание событий. Создай или отредактируй товар.
                            </p>
                        ) : (
                            events.map((event, index) => (
                                <div
                                    key={`${event.product.id}-${event.changed_at}-${index}`}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                                event.action === 'created'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {event.action === 'created'
                                                ? 'Создан'
                                                : event.action === 'updated'
                                                    ? 'Обновлён'
                                                    : event.action}
                                        </span>
                                        <span className="font-medium">
                                            {event.product.name}
                                        </span>
                                        <span className="text-slate-400">
                                            ID: {event.product.id}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-500">
                                            {new Date(
                                                event.changed_at,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-slate-500">
                                        Цена: {event.product.price} · Остаток:{' '}
                                        {event.product.stock}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">
                        {editingId
                            ? `Редактирование товара #${editingId}`
                            : 'Создать товар'}
                    </h2>

                    <form
                        onSubmit={saveProduct}
                        className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <label className="space-y-1.5 text-sm font-medium">
                            Категория *
                            <select
                                className={inputClass}
                                required
                                value={form.category_id}
                                onChange={(e) =>
                                    updateField('category_id', e.target.value)
                                }
                            >
                                <option value="">Выберите категорию</option>
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
                                maxLength={255}
                                value={form.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    setForm((previous) => ({
                                        ...previous,
                                        name,
                                        slug: editingId
                                            ? previous.slug
                                            : name
                                                .toLowerCase()
                                                .trim()
                                                .replace(
                                                    /[^a-z0-9а-яё]+/gi,
                                                    '-',
                                                )
                                                .replace(/^-|-$/g, ''),
                                    }));
                                }}
                                placeholder="Например, Смартфон"
                            />
                        </label>

                        <label className="space-y-1.5 text-sm font-medium">
                            Slug *
                            <input
                                className={inputClass}
                                required
                                maxLength={255}
                                pattern="[A-Za-z0-9_-]+"
                                value={form.slug}
                                onChange={(e) =>
                                    updateField('slug', e.target.value)
                                }
                                placeholder="smartphone-x"
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
                                value={form.price}
                                onChange={(e) =>
                                    updateField('price', e.target.value)
                                }
                                placeholder="199.99"
                            />
                        </label>

                        <label className="space-y-1.5 text-sm font-medium">
                            Остаток
                            <input
                                className={inputClass}
                                type="number"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={(e) =>
                                    updateField('stock', e.target.value)
                                }
                            />
                        </label>

                        <label className="space-y-1.5 text-sm font-medium">
                            Теги
                            <select
                                multiple
                                className={inputClass}
                                value={form.tag_ids.map(String)}
                                onChange={(e) =>
                                    updateField(
                                        'tag_ids',
                                        Array.from(
                                            e.target.selectedOptions,
                                            (option) => Number(option.value),
                                        ),
                                    )
                                }
                            >
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
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
                                value={form.description}
                                onChange={(e) =>
                                    updateField('description', e.target.value)
                                }
                                placeholder="Описание товара"
                            />
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) =>
                                    updateField('is_active', e.target.checked)
                                }
                            />
                            Товар активен
                        </label>

                        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                            <button
                                type="submit"
                                disabled={saving || categories.length === 0}
                                className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                            >
                                {saving
                                    ? 'Сохранение...'
                                    : editingId
                                        ? 'Сохранить изменения'
                                        : 'Создать товар'}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className={`${buttonClass} border border-slate-200 hover:bg-slate-50`}
                                >
                                    Отмена
                                </button>
                            )}
                        </div>
                    </form>
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

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Товары</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Всего на текущей странице: {products.length}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadProducts()}
                            disabled={loading}
                            className={`${buttonClass} border border-slate-200 hover:bg-slate-50`}
                        >
                            {loading ? 'Загрузка...' : 'Обновить список'}
                        </button>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-3 py-3">ID</th>
                                <th className="px-3 py-3">Товар</th>
                                <th className="px-3 py-3">Категория</th>
                                <th className="px-3 py-3">Цена</th>
                                <th className="px-3 py-3">Остаток</th>
                                <th className="px-3 py-3">Теги</th>
                                <th className="px-3 py-3">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.map((product) => (
                                <tr
                                    key={product.id}
                                    className="border-b border-slate-100 last:border-0"
                                >
                                    <td className="px-3 py-4 text-slate-500">
                                        {product.id}
                                    </td>
                                    <td className="px-3 py-4">
                                        <p className="font-medium">
                                            {product.name}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {product.slug}
                                        </p>
                                        <span
                                            className={`mt-1 inline-block text-xs ${
                                                product.is_active
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                                {product.is_active
                                                    ? 'Активен'
                                                    : 'Неактивен'}
                                            </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        {product.category?.name ?? '—'}
                                    </td>
                                    <td className="px-3 py-4">
                                        {Number(product.price).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-4">
                                        {product.stock}
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
                                                onClick={() =>
                                                    editProduct(product)
                                                }
                                                className={`${buttonClass} border border-slate-200 hover:bg-slate-50`}
                                            >
                                                Изменить
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void deleteProduct(product)
                                                }
                                                className={`${buttonClass} bg-red-50 text-red-700 hover:bg-red-100`}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!loading && products.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-3 py-10 text-center text-slate-500"
                                    >
                                        Товаров пока нет. Создай первый
                                        товар через форму выше.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
