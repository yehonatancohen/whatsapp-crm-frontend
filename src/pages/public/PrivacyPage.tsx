export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-right bg-cream transition-colors min-h-screen">
      <h1 className="text-3xl font-bold text-charcoal mb-6">מדיניות פרטיות</h1>
      <div className="prose-sm space-y-6 text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">1. איסוף מידע</h2>
          <p>אנחנו אוספים מידע שאתה מספק לנו ישירות בעת ההרשמה לשירות, כגון שם, כתובת אימייל ופרטי תשלום. בנוסף, בעת שימוש בשירות, אנחנו עשויים לאסוף מידע טכני על המכשיר והשימוש שלך.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">2. שימוש במידע</h2>
          <p>המידע שאנו אוספים משמש לאספקת השירות, לשיפור חווית המשתמש, לעיבוד תשלומים ולתקשורת איתך בנוגע לחשבונך או לעדכונים בשירות.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">3. אבטחת מידע</h2>
          <p>אנחנו נוקטים באמצעי אבטחה מתקדמים כדי להגן על המידע האישי שלך מפני גישה לא מורשית, שינוי או חשיפה. כל פרטי התשלום מעובדים בצורה מאובטחת על ידי ספקים חיצוניים המוסמכים לכך (Stripe).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">4. שיתוף מידע עם צדדים שלישיים</h2>
          <p>איננו מוכרים או משכירים את המידע האישי שלך לצדדים שלישיים. אנחנו עשויים לשתף מידע עם ספקי שירות שעוזרים לנו לתפעל את המערכת, בכפוף להתחייבויות סודיות.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-charcoal mb-3">5. שינויים במדיניות הפרטיות</h2>
          <p>אנחנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. במקרה של שינויים מהותיים, נודיע לך על כך באמצעות האימייל או הודעה במערכת.</p>
        </section>

        <div className="pt-8 border-t border-border">
          <p className="text-xs">עודכן לאחרונה: 15 במרץ, 2026</p>
        </div>
      </div>
    </div>
  );
}
