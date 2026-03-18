import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

const fallbackPlans = [
  {
    tier: 'PRO',
    name: 'מקצוען',
    priceMonthly: 299,
    priceId: '',
    features: [
      '5 חשבונות וואטסאפ',
      '10,000 אנשי קשר',
      '50 קמפיינים בחודש',
      '5,000 הודעות ביום',
      'חימום מספרים',
      'תיבת הודעות',
      'תמיכה מועדפת',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'ארגוני',
    priceMonthly: 0,
    priceId: '',
    features: [
      '20 חשבונות וואטסאפ',
      '100,000 אנשי קשר',
      'קמפיינים ללא הגבלה',
      'הודעות ללא הגבלה',
      'חימום מספרים',
      'תיבת הודעות',
      'תמיכה מועדפת',
      'אינטגרציות מותאמות אישית',
    ],
  },
];

export function PricingPage() {
  const { user } = useAuth();
  const { data: plans } = usePlans();

  const subscription = user?.subscription;
  // Filter plans to only show PRO and ENTERPRISE
  const apiPlans = plans && plans.length > 0
    ? plans.filter((p: any) => p.tier === 'PRO' || p.tier === 'ENTERPRISE')
    : null;
  const displayPlans = apiPlans && apiPlans.length > 0 ? apiPlans : fallbackPlans;

  return (
    <div className="min-h-screen px-4 py-12 bg-cream transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-3">בחר את המסלול שלך</h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            התחל עם 7 ימי ניסיון חינם. אין צורך בכרטיס אשראי. שדרג בכל עת.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {displayPlans.map((plan) => {
            const isPro = plan.tier === 'PRO';
            const isEnterprise = plan.tier === 'ENTERPRISE';
            const isCurrent = subscription?.planTier === plan.tier &&
              ['TRIALING', 'ACTIVE'].includes(subscription?.status || '');

            return (
              <div
                key={plan.tier}
                className={`relative bg-white border rounded-2xl p-6 flex flex-col shadow-sm ${
                  isPro
                    ? 'border-2 border-accent'
                    : 'border border-border'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
                    הכי פופולרי
                  </div>
                )}

                <h2 className="text-lg font-semibold text-charcoal text-right">{plan.name}</h2>

                <div className="mt-3 mb-5 text-right">
                  {isEnterprise ? (
                    <span className="text-2xl font-bold text-charcoal">צרו קשר לתיאום מחיר</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-charcoal">₪{plan.priceMonthly}</span>
                      <span className="text-muted text-sm">/חודש</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1 text-right">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink">
                      <svg className="w-4 h-4 text-accent mt-0.5 shrink-0 order-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="flex-1">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center text-sm font-medium py-2.5 rounded-lg border border-accent text-accent">
                    התוכנית הנוכחית שלך
                  </div>
                ) : (
                  <a
                    href={`mailto:support@shadar.co.il?subject=${encodeURIComponent(`שדרוג לתוכנית ${plan.name}`)}`}
                    className={`w-full text-center text-sm font-medium py-2.5 rounded-lg transition-colors block ${
                      isPro
                        ? 'bg-accent hover:bg-accent-hover text-white'
                        : 'bg-white hover:bg-cream border border-border text-charcoal'
                    }`}
                  >
                    {isPro ? 'צרו קשר לרכישה' : 'צרו קשר'}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {!user && (
          <div className="text-center mt-8">
            <p className="text-muted text-sm">
              כבר יש לך חשבון?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover">התחבר כאן</Link>
            </p>
          </div>
        )}

        {user && (
          <div className="text-center mt-8">
            <Link to="/dashboard" className="text-accent hover:text-accent-hover text-sm">
              חזרה ללוח הבקרה
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
