import { useState } from 'react';

const SUPPORT_EMAIL = 'yoncohenyon@gmail.com';

const faqs = [
  {
    q: 'איך מחברים חשבון וואטסאפ?',
    a: 'עבור ללשונית "חשבונות", לחץ על "הוסף חשבון", תן לו שם וסרוק את קוד ה-QR המופיע באמצעות אפליקציית וואטסאפ בטלפון שלך (מכשירים מקושרים).',
  },
  {
    q: 'מה זה "חימום מספרים" (Warmup)?',
    a: 'חימום הוא תהליך של שליחת הודעות אוטומטיות בין החשבונות שלך כדי לבנות מוניטין חיובי מול וואטסאפ. זה מוריד משמעותית את הסיכון לחסימה כששולחים קמפיינים גדולים.',
  },
  {
    q: 'איך מייבאים אנשי קשר?',
    a: 'בלשונית "אנשי קשר", לחץ על "ייבוא אנשי קשר". תוכל להעלות קובץ CSV או Excel. וודא שיש לך עמודה עם מספרי הטלפון בפורמט בינלאומי (למשל 972501234567).',
  },
  {
    q: 'כמה הודעות אני יכול לשלוח ביום?',
    a: 'הכמות תלויה בתוכנית שבחרת ובגיל החשבון שלך. אנחנו ממליצים להתחיל לאט ולהעלות את הכמות בהדרגה תוך שימוש במערכת החימום שלנו.',
  },
  {
    q: 'האם אפשר לשלוח הודעות לקבוצות?',
    a: 'כן! ביצירת קמפיין תוכל לבחור בין שליחה לרשימת תפוצה לבין שליחה לקבוצה קיימת שאתה חבר בה.',
  },
  {
    q: 'איך עובד נושא התשלום?',
    a: 'התשלומים מתבצעים ישירות מולי באופן אישי. צרו קשר בוואטסאפ או במייל לתיאום ובחירת תוכנית.',
  },
];

export function HelpPage() {
  const [openIndex, setOpenOpenIndex] = useState<number | null>(null);
  const [emailRevealed, setEmailRevealed] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-right bg-cream transition-colors min-h-screen">
      <h1 className="text-3xl font-bold text-charcoal mb-3">מרכז עזרה</h1>
      <p className="text-muted mb-10">כל מה שצריך לדעת כדי להפיק את המירב משדר.</p>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setOpenOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-right hover:bg-cream/50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 text-accent transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span className="font-medium text-charcoal">{faq.q}</span>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5 pt-1 text-sm text-muted leading-relaxed border-t border-border/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 bg-accent-light/30 border border-accent/10 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-charcoal mb-2">צריך עזרה נוספת?</h2>
        <p className="text-sm text-muted mb-6">זמין עבורך לכל שאלה טכנית או עסקית.</p>
        {emailRevealed ? (
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-block bg-accent hover:bg-accent-hover text-[#ffffff] font-medium px-8 py-3 rounded-lg transition-colors"
            dir="ltr"
          >
            {SUPPORT_EMAIL}
          </a>
        ) : (
          <button
            onClick={() => setEmailRevealed(true)}
            className="inline-block bg-accent hover:bg-accent-hover text-[#ffffff] font-medium px-8 py-3 rounded-lg transition-colors"
          >
            לחץ לחשיפת כתובת המייל
          </button>
        )}
      </div>
    </div>
  );
}
