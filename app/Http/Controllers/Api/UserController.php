<?php

namespace App\Http\Controllers\Api;

use App\Events\UserChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(
            User::query()
                ->with('profile')
                ->latest()
                ->paginate(15)
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['profile']);
        $profile = $request->validated('profile') ?? [];

        $user = DB::transaction(function () use ($data, $profile): User {
            $user = User::query()->create($data);
            $user->profile()->create($profile);

            return $user;
        });

        $user->load('profile');
        event(new UserChanged($user, 'created'));

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('profile'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $data = $request->safe()->except(['profile']);

        $user = DB::transaction(function () use ($request, $user, $data): User {
            if ($data !== []) {
                $user->update($data);
            }

            if ($request->exists('profile')) {
                $user->profile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $request->validated('profile') ?? [],
                );
            }

            return $user;
        });

        $user->refresh()->load('profile');
        event(new UserChanged($user, 'updated'));

        return new UserResource($user);
    }

    public function destroy(User $user): Response
    {
        event(new UserChanged($user, 'deleted'));
        $user->delete();

        return response()->noContent();
    }
}
