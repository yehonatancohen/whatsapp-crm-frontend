import { Link } from 'react-router-dom';

const features = [
  {
    title: 'ניהול מספר חשבונות',
    desc: 'חבר ונהל מספר חשבונות וואטסאפ מלוח בקרה אחד.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    ),
  },
  {
    title: 'קמפיינים בתפוצה רחבה',
    desc: 'שלח הודעות מותאמות אישית לאלפי אנשי קשר עם מנגנון הגנה מפני חסימות.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    ),
  },
  {
    title: 'ניהול אנשי קשר',
    desc: 'ייבא, ארגן ופלח אנשי קשר לרשימות עבור פניה ממוקדת.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    ),
  },
  {
    title: 'חימום מספרים',
    desc: 'חמם מספרים חדשים בהדרגה כדי להימנע מחסימות ולבנות אמון מול וואטסאפ.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    ),
  },
  {
    title: 'תיבת דואר מאוחדת',
    desc: 'קרא והשב להודעות מכל החשבונות במקום אחד.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    ),
  },
  {
    title: 'אנליטיקה ויומנים',
    desc: 'עקוב אחר ביצועי קמפיינים, אחוזי מסירה ופעילות חשבון בזמן אמת.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    ),
  },
];

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-4 pt-16 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-charcoal mb-5 leading-tight">
            נהל את הוואטסאפ שלך<br />בצורה חכמה
          </h1>
          <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
            הפלטפורמה המקיפה לשיווק בוואטסאפ, ניהול מספר חשבונות ושיפור הקשר עם הלקוחות.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors">
              התחל ניסיון חינם
            </Link>
            <Link to="/pricing" className="text-muted hover:text-charcoal font-medium px-6 py-3 transition-colors">
              צפה במחירים
            </Link>
          </div>
          <p className="text-xs text-faded mt-4">7 ימי ניסיון חינם. אין צורך בכרטיס אשראי.</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-charcoal text-center mb-10">כל מה שאתה צריך</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center sm:items-start sm:text-start">
                <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-accent">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-charcoal mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-3">מוכן להתחיל?</h2>
          <p className="text-muted mb-6">הצטרף לאלפי עסקים המשתמשים ב-<span className="font-logo text-xl">שדר</span> כדי לצמוח בוואטסאפ.</p>
          <Link to="/register" className="inline-block bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors">
            התחל את תקופת הניסיון שלך
          </Link>
        </div>
      </section>
    </>
  );
}
