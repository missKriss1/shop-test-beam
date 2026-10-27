<?php

use App\Models\Product;
use App\Models\Tag;

it('creates a tag', function () {
    $this->postJson('/api/tags', [
        'name' => 'Хит',
        'slug' => 'hit',
    ])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'hit');
});

it('shows products attached through the many-to-many relation', function () {
    $tag = Tag::factory()->create(['name' => 'Sale', 'slug' => 'sale-show']);
    $product = Product::factory()->create();
    $product->tags()->attach($tag);

    $this->getJson("/api/tags/{$tag->id}")
        ->assertOk()
        ->assertJsonPath('data.products.0.id', $product->id);
});

it('returns 409 when deleting a category that still has products', function () {
    $product = Product::factory()->create();

    $this->deleteJson("/api/categories/{$product->category_id}")
        ->assertConflict()
        ->assertJsonPath('message', 'Нельзя удалить категорию, пока к ней привязаны товары.');
});
