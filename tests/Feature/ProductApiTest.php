<?php

use App\Events\ProductChanged;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tag;
use Illuminate\Support\Facades\Event;

it('creates a product with category and tags and broadcasts the change', function () {
    Event::fake([ProductChanged::class]);

    $category = Category::factory()->create();
    $tags = Tag::factory()->count(2)->create();

    $response = $this->postJson('/api/products', [
        'category_id' => $category->id,
        'name' => 'Смартфон X',
        'slug' => 'smartphone-x',
        'description' => 'Тестовый товар',
        'price' => 19990.5,
        'stock' => 4,
        'is_active' => true,
        'tag_ids' => $tags->pluck('id')->all(),
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Смартфон X')
        ->assertJsonPath('data.category.id', $category->id)
        ->assertJsonCount(2, 'data.tags');

    $this->assertDatabaseHas('products', [
        'slug' => 'smartphone-x',
        'category_id' => $category->id,
    ]);

    Event::assertDispatched(ProductChanged::class, function (ProductChanged $event): bool {
        return $event->action === 'created' && $event->product->slug === 'smartphone-x';
    });
});

it('rejects a product without a category', function () {
    $this->postJson('/api/products', [
        'name' => 'Без категории',
        'slug' => 'no-category',
        'price' => 10,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id']);
});

it('updates a product and syncs tags', function () {
    Event::fake([ProductChanged::class]);

    $product = Product::factory()->create(['name' => 'Старое имя']);
    $tag = Tag::factory()->create();

    $this->putJson("/api/products/{$product->id}", [
        'name' => 'Новое имя',
        'tag_ids' => [$tag->id],
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Новое имя')
        ->assertJsonPath('data.tags.0.id', $tag->id);

    Event::assertDispatched(ProductChanged::class, fn (ProductChanged $event): bool => $event->action === 'updated');
});

it('deletes a product and broadcasts the deletion', function () {
    Event::fake([ProductChanged::class]);

    $product = Product::factory()->create();

    $this->deleteJson("/api/products/{$product->id}")->assertNoContent();

    $this->assertDatabaseMissing('products', ['id' => $product->id]);

    Event::assertDispatched(ProductChanged::class, fn (ProductChanged $event): bool => $event->action === 'deleted');
});
