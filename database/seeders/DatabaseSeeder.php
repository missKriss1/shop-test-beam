<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => 'password'],
        );

        $user->profile()->firstOrCreate(
            ['user_id' => $user->id],
            ['phone' => '+79990000000', 'address' => 'Москва, Тверская 1'],
        );

        $phones = Category::query()->firstOrCreate(
            ['slug' => 'phones'],
            ['name' => 'Смартфоны', 'description' => 'Мобильные устройства'],
        );

        $audio = Category::query()->firstOrCreate(
            ['slug' => 'audio'],
            ['name' => 'Аудио', 'description' => 'Наушники и колонки'],
        );

      $newTag = Tag::query()->updateOrCreate(
          ['name' => 'Новинка'],
          ['slug' => 'new'],
      );

      $saleTag = Tag::query()->updateOrCreate(
          ['name' => 'Скидка'],
          ['slug' => 'sale'],
      );

      $wirelessTag = Tag::query()->updateOrCreate(
          ['name' => 'Беспроводное'],
          ['slug' => 'wireless'],
      );

        $phone = Product::query()->firstOrCreate(
            ['slug' => 'pixel-phone'],
            [
                'category_id' => $phones->id,
                'name' => 'Смартфон Pixel',
                'description' => 'Демонстрационный смартфон',
                'price' => 49990,
                'stock' => 8,
                'is_active' => true,
            ],
        );

        $headphones = Product::query()->firstOrCreate(
            ['slug' => 'wireless-headphones'],
            [
                'category_id' => $audio->id,
                'name' => 'Беспроводные наушники',
                'description' => 'Демонстрационные наушники',
                'price' => 7990,
                'stock' => 20,
                'is_active' => true,
            ],
        );

        $phone->tags()->syncWithoutDetaching([$newTag->id, $saleTag->id]);
        $headphones->tags()->syncWithoutDetaching([$wirelessTag->id, $saleTag->id]);
    }
}
