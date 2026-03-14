import { useAuth } from '../context/AuthContext';
import { usePlans, useCheckout, useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

const fallbackPlans = [
  {
    tier: 'STARTER',
    name: 'Starter',
    priceMonthly: 29,
    priceId: '',
    features: [
      '2 WhatsApp accounts',
      '1,000 contacts',
      '10 campaigns/month',
      '500 messages/day',
      'Number warmup',
      'Chat inbox',
    ],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    priceMonthly: 79,
    priceId: '',
    features: [
      '5 WhatsApp accounts',
      '10,000 contacts',
      '50 campaigns/month',
      '5,000 messages/day',
      'Number warmup',
      'Chat inbox',
      'Priority support',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthly: 199,
    priceId: '',
    features: [
      '20 WhatsApp accounts',
      '100,000 contacts',
      'Unlimited campaigns',
      'Unlimited messages',
      'Number warmup',
      'Chat inbox',
      'Priority support',
      'Custom integrations',
    ],
  },
];

export function PricingPage() {
  const { user } = useAuth();
  const { data: plans } = usePlans();
  const { data: subscription } = useSubscription();
  const checkout = useCheckout();

  const displayPlans = plans && plans.length > 0 ? plans : fallbackPlans;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">Choose your plan</h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Start with a free 7-day trial. No credit card required. Upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayPlans.map((plan, i) => {
            const isPopular = i === 1;
            const isCurrent = subscription?.planTier === plan.tier &&
              ['TRIALING', 'ACTIVE'].includes(subscription?.status || '');

            return (
              <div
                key={plan.tier}
                className={`relative bg-white border rounded-2xl p-6 flex flex-col shadow-sm ${
                  isPopular
                    ? 'border-2 border-accent'
                    : 'border border-border'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h2 className="text-lg font-semibold text-charcoal">{plan.name}</h2>
                <div className="mt-3 mb-5">
                  <span className="text-3xl font-bold text-charcoal">${plan.priceMonthly}</span>
                  <span className="text-muted text-sm">/month</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink">
                      <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center text-sm font-medium py-2.5 rounded-lg border border-accent text-accent">
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => plan.priceId && checkout.mutate(plan.priceId)}
                    disabled={checkout.isPending || !plan.priceId}
                    className={`w-full text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                      isPopular
                        ? 'bg-accent hover:bg-accent-hover text-white'
                        : 'bg-white hover:bg-cream border border-border text-charcoal'
                    }`}
                  >
                    {checkout.isPending ? 'Redirecting...' : 'Get started'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!user && (
          <div className="text-center mt-8">
            <p className="text-muted text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover">Sign in</Link>
            </p>
          </div>
        )}

        {user && (
          <div className="text-center mt-8">
            <Link to="/dashboard" className="text-accent hover:text-accent-hover text-sm">
              Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
