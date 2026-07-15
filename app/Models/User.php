<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name', 'email', 'password', 'role',
    'plan_id', 'pdf_count', 'pdf_count_reset_at',
    'stripe_customer_id', 'stripe_subscription_id',
    'subscription_ends_at',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'subscription_ends_at'   => 'datetime',
            'pdf_count_reset_at'     => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        // Auto-assign Basic plan to new users
        static::creating(function ($user) {
            if (! $user->plan_id) {
                $basicPlan = Plan::where('slug', 'basic')->first();
                if ($basicPlan) {
                    $user->plan_id        = $basicPlan->id;
                    $user->pdf_count      = 0;
                    $user->pdf_count_reset_at = now()->addMonth();
                }
            }
        });

    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function pdfSummaries(): HasMany
    {
        return $this->hasMany(pdfSummary::class);
    }

    public function canSummarizePdf(): bool
    {
        if (! $this->plan) {
            return false;
        }

        if ($this->pdf_count_reset_at && $this->pdf_count_reset_at->isPast()) {
            $this->update([
                'pdf_count'          => 0,
                'pdf_count_reset_at' => now()->addMonth(),
            ]);
        }

        // pdf_limit < 0 يعني بلا حدود (Unlimited)
        if ($this->plan->pdf_limit < 0) {
            return true;
        }

        return $this->pdf_count < $this->plan->pdf_limit;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function hasActiveSubscription(): bool
    {
        if (! $this->stripe_subscription_id) {
            return false;
        }
        // إذا كان لديك حقل لتاريخ انتهاء الاشتراك في جدول المستخدمين
        if ($this->subscription_ends_at && $this->subscription_ends_at->isPast()) {
            return false;
        }

        return true;
    }

    public function canChangePlan(): bool
    {
        return $this->hasActiveSubscription();
    }

    public function getRemainingPdfs(): int|string
    {
        if (! $this->plan) {
            return 0;
        }
        if ($this->plan->pdf_limit < 0) {
            return 'Unlimited';
        }

        return max(0, $this->plan->pdf_limit - ($this->pdf_count ?? 0));
    }
}
