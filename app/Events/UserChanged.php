<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public string $action,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('users'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'changed_at' => now()->toIso8601String(),
        ];
    }
}
