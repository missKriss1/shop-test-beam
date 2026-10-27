<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use App\Events\ProductChanged;

class ProductController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ProductResource::collection(
            Product::query()
                ->with(['category', 'tags'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(StoreProductRequest $request): ProductResource
    {
        $data = $request->validated();

        $tagIds = $data['tag_ids'] ?? [];
        unset($data['tag_ids']);

        $product = Product::create($data);
        $product->tags()->sync($tagIds);
        event(new ProductChanged($product, 'created'));

        return new ProductResource(
            $product->load(['category', 'tags'])
        );
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource(
            $product->load(['category', 'tags'])
        );
    }

    public function update(
        UpdateProductRequest $request,
        Product $product
    ): ProductResource {
        $data = $request->validated();

        if (array_key_exists('tag_ids', $data)) {
            $product->tags()->sync($data['tag_ids']);
            unset($data['tag_ids']);
        }

        $product->update($data);
        event(new ProductChanged($product, 'updated'));

        return new ProductResource(
            $product->refresh()->load(['category', 'tags'])
        );
    }

    public function destroy(Product $product): Response
    {
        $product->delete();

        return response()->noContent();
    }
}
