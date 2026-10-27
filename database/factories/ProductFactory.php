<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'description' => fake()->optional()->sentence(),
            'price' => fake()->randomFloat(2, 10, 2000),
            'stock' => fake()->numberBetween(0, 50),
            'is_active' => true,
        ];
    }
}
