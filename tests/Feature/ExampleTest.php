<?php

use App\Models\Category;

test('categories endpoint returns a list of categories', function () {
    Category::factory()->create([
        'name' => 'Электроника',
        'slug' => 'electronics',
    ]);

    $response = $this->getJson('/api/categories');

    $response
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Электроника')
        ->assertJsonPath('data.0.slug', 'electronics');
});

test('a category can be created', function () {
    $response = $this->postJson('/api/categories', [
        'name' => 'Аксессуары',
        'slug' => 'accessories',
        'description' => 'Аксессуары для электроники',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Аксессуары')
        ->assertJsonPath('data.slug', 'accessories');
});

test('category creation validates required fields', function () {
    $response = $this->postJson('/api/categories', []);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'slug']);
});

test('a product can be created', function () {
    $category = \App\Models\Category::factory()->create();

    $response = $this->postJson('/api/products', [
        'category_id' => $category->id,
        'name' => 'Тестовые наушники',
        'slug' => 'test-headphones',
        'description' => 'Беспроводные наушники',
        'price' => 3500,
        'stock' => 10,
        'is_active' => true,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Тестовые наушники')
        ->assertJsonPath('data.slug', 'test-headphones')
        ->assertJsonPath('data.category_id', $category->id);
});

test('product creation validates price', function () {
    $category = \App\Models\Category::factory()->create();

    $response = $this->postJson('/api/products', [
        'category_id' => $category->id,
        'name' => 'Тестовые наушники',
        'slug' => 'test-headphones',
        'price' => -100,
    ]);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['price']);
});

test('a product can be updated', function () {
    $category = \App\Models\Category::factory()->create();

    $product = \App\Models\Product::create([
        'category_id' => $category->id,
        'name' => 'Старые наушники',
        'slug' => 'old-headphones',
        'price' => 3000,
        'stock' => 5,
        'is_active' => true,
    ]);

    $response = $this->patchJson("/api/products/{$product->id}", [
        'name' => 'Новые наушники',
        'price' => 2500,
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.name', 'Новые наушники')
        ->assertJsonPath('data.price', '2500.00');
});

test('a product can be deleted', function () {
    $category = \App\Models\Category::factory()->create();

    $product = \App\Models\Product::create([
        'category_id' => $category->id,
        'name' => 'Наушники для удаления',
        'slug' => 'headphones-to-delete',
        'price' => 1500,
        'stock' => 3,
        'is_active' => true,
    ]);

    $response = $this->deleteJson("/api/products/{$product->id}");

    $response->assertNoContent();

    $this->assertDatabaseMissing('products', [
        'id' => $product->id,
    ]);
});



