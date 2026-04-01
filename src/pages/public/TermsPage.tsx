export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-right bg-cream transition-colors min-h-screen">
      <h1 className="text-3xl font-bold text-charcoal mb-6">תנאי שימוש</h1>
      <div className="prose-sm space-y-6 text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">1. קבלת התנאים</h2>
          <p>בעצם הגישה או השימוש בשירותי שדר, אתה מסכים להיות מחויב לתנאי שימוש אלה. אם אינך מסכים לחלק כלשהו מהתנאים, אינך רשאי להשתמש בשירות.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">2. תיאור השירות</h2>
          <p>שדר מספקת פלטפורמה לניהול חשבונות וואטסאפ, שליחת הודעות וניהול אנשי קשר. השירות ניתן כפי שהוא ("As Is") ובכפוף לזמינות.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">3. אחריות המשתמש</h2>
          <p>הנך האחראי הבלעדי לכל פעילות המבוצעת בחשבונך. עליך לציית לכל חוקי הגנת הפרטיות, חוקי הספאם ותנאי השימוש של וואטסאפ (WhatsApp Inc). חל איסור מוחלט להשתמש בשירות לשליחת הודעות פוגעניות, הטרדה או פעילות בלתי חוקית.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">4. תשלומים וביטולים</h2>
          <p>השירות ניתן תמורת תשלום חודשי מראש. באפשרותך לבטל את המנוי בכל עת. לאחר הביטול, הגישה לשירות תימשך עד סוף תקופת החיוב הנוכחית. לא יינתנו החזרים כספיים על חלקי חודש.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">5. הגבלת אחריות</h2>
          <p>שדר לא תהיה אחראית לכל נזק ישיר, עקיף או תוצאתי הנובע מהשימוש בשירות, לרבות חסימת חשבונות וואטסאפ על ידי WhatsApp Inc.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">6. הצהרת אחריות בנוגע לוואטסאפ</h2>
          <p className="font-semibold text-charcoal mb-2">⚠️ קרא בעיון לפני השימוש:</p>
          <p>כלי זה משתמש בוואטסאפ בדרכים העלולות להפר את תנאי השירות של WhatsApp Inc. שדר אינה קשורה ל-WhatsApp ואינה שותפה רשמית שלה. השימוש בשירות הוא על אחריותך הבלעדית.</p>
          <ul className="mt-3 space-y-2 list-disc list-inside marker:text-amber-500">
            <li>אנו ממליצים בחום להתחיל עם מספרי טלפון משניים ולא עם מספרך הראשי.</li>
            <li>חסימת חשבון וואטסאפ על ידי WhatsApp Inc. אינה מזכה בהחזר כספי.</li>
            <li>אינך רשאי להשתמש בשירות לשליחת ספאם, הודעות לא רצויות, פישינג או כל פעילות בלתי חוקית אחרת.</li>
            <li>שדר שומרת לעצמה את הזכות להשעות חשבון שעושה שימוש לרעה בשירות.</li>
          </ul>
        </section>

        <div className="pt-8 border-t border-border">
          <p className="text-xs">עודכן לאחרונה: 1 באפריל, 2026</p>
        </div>
      </div>
    </div>
  );
}
