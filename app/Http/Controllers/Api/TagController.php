<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TagController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TagResource::collection(
            Tag::query()->latest()->paginate(15)
        );
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $tag = Tag::query()->create($request->validated());

        return (new TagResource($tag))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Tag $tag): TagResource
    {
        return new TagResource($tag->load('products'));
    }

    public function update(UpdateTagRequest $request, Tag $tag): TagResource
    {
        $tag->update($request->validated());

        return new TagResource($tag->refresh());
    }

    public function destroy(Tag $tag): Response
    {
        $tag->delete();

        return response()->noContent();
    }
}
