<?php

namespace App\Http\Controllers\Api;

use App\Events\ProductChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

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

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['tag_ids']);
        $tagIds = $request->validated('tag_ids') ?? [];

        $product = DB::transaction(function () use ($data, $tagIds): Product {
            $product = Product::query()->create($data);
            $product->tags()->sync($tagIds);

            return $product;
        });

        $product->load(['category', 'tags']);
        event(new ProductChanged($product, 'created'));

        return (new ProductResource($product))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
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
        $data = $request->safe()->except(['tag_ids']);

        $product = DB::transaction(function () use ($request, $product, $data): Product {
            if ($data !== []) {
                $product->update($data);
            }

            if ($request->exists('tag_ids')) {
                $product->tags()->sync($request->validated('tag_ids') ?? []);
            }

            return $product;
        });

        $product->refresh()->load(['category', 'tags']);
        event(new ProductChanged($product, 'updated'));

        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        event(new ProductChanged($product, 'deleted'));
        $product->delete();

        return response()->noContent();
    }
}
