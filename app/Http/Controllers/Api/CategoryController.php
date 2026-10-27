<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::query()->latest()->paginate(15)
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::query()->create($request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('products'));
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): CategoryResource {
        $category->update($request->validated());

        return new CategoryResource($category->refresh());
    }

    public function destroy(Category $category): JsonResponse|Response
    {
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Нельзя удалить категорию, пока к ней привязаны товары.',
            ], Response::HTTP_CONFLICT);
        }

        $category->delete();

        return response()->noContent();
    }
}
