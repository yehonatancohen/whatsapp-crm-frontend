import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const WA_NUMBER = '972586181898';

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

  const subscription = user?.subscription;
  const displayPlans = fallbackPlans;

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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-[#ffffff] text-xs font-semibold px-3 py-1 rounded-full">
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
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`שלום, אני מעוניין בתוכנית ${plan.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full text-center text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isPro
                        ? 'bg-accent hover:bg-accent-hover text-[#ffffff]'
                        : 'bg-white hover:bg-cream border border-border text-charcoal'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {isPro ? 'צור קשר לרכישה' : 'צור קשר'}
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
