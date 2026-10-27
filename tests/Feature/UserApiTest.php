<?php

use App\Events\UserChanged;
use App\Models\User;
use Illuminate\Support\Facades\Event;

it('creates a user with a one-to-one profile and broadcasts the change', function () {
    Event::fake([UserChanged::class]);

    $response = $this->postJson('/api/users', [
        'name' => 'Анна',
        'email' => 'anna@example.com',
        'password' => 'password123',
        'profile' => [
            'phone' => '+79991112233',
            'address' => 'Казань',
        ],
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.name', 'Анна')
        ->assertJsonPath('data.email', 'anna@example.com')
        ->assertJsonPath('data.profile.phone', '+79991112233')
        ->assertJsonMissing(['password']);

    $this->assertDatabaseHas('users', ['email' => 'anna@example.com']);
    $this->assertDatabaseHas('profiles', [
        'phone' => '+79991112233',
        'address' => 'Казань',
    ]);

    Event::assertDispatched(UserChanged::class, fn (UserChanged $event): bool => $event->action === 'created');
});

it('rejects a user without an email', function () {
    $this->postJson('/api/users', [
        'name' => 'Без почты',
        'password' => 'password123',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('updates the nested profile of a user', function () {
    Event::fake([UserChanged::class]);

    $user = User::factory()->create();
    $user->profile()->create(['phone' => '111', 'address' => 'Старый адрес']);

    $this->putJson("/api/users/{$user->id}", [
        'profile' => [
            'phone' => '222',
            'address' => 'Новый адрес',
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.profile.phone', '222')
        ->assertJsonPath('data.profile.address', 'Новый адрес');

    Event::assertDispatched(UserChanged::class, fn (UserChanged $event): bool => $event->action === 'updated');
});

it('deletes a user and the related profile', function () {
    $user = User::factory()->create();
    $user->profile()->create(['phone' => '333']);

    $this->deleteJson("/api/users/{$user->id}")->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
    $this->assertDatabaseMissing('profiles', ['user_id' => $user->id]);
});
