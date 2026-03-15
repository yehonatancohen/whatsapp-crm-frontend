export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-right bg-cream transition-colors min-h-screen">
      <h1 className="text-3xl font-bold text-charcoal mb-6">אודות שדר</h1>

      <div className="prose-sm space-y-4 text-muted leading-relaxed">
        <p>
          שדר היא הפלטפורמה המובילה לניהול ושיווק בוואטסאפ עבור עסקים קטנים ובינוניים.
          המטרה שלנו היא לעזור לעסקים לתקשר טוב יותר עם הלקוחות שלהם, לשפר את אחוזי המסירה ולהגדיל את המכירות באמצעות הכלי החזק ביותר כיום — וואטסאפ.
        </p>

        <h2 className="text-xl font-semibold text-charcoal mt-8 mb-4">למה שדר?</h2>
        <p>
          בניגוד לכלים אחרים, שדר נבנתה תוך מחשבה על פשטות ועוצמה. אנחנו מאפשרים לך לנהל מספר חשבונות במקביל, לחמם מספרים חדשים כדי למנוע חסימות, ולשלוח קמפיינים מתוחכמים המותאמים אישית לכל לקוח.
        </p>

        <h2 className="text-xl font-semibold text-charcoal mt-8 mb-4">הטכנולוגיה שלנו</h2>
        <p>
          אנחנו משתמשים בטכנולוגיה המתקדמת ביותר כדי להבטיח שהחשבונות שלך יישארו בטוחים. מערכת ה-Warmup הייחודית שלנו מדמה התנהגות אנושית ומסייעת בבניית אמון מול שרתי וואטסאפ, מה שמאפשר לך להגיע ללקוחות שלך ללא חשש מחסימה.
        </p>

        <div className="pt-8 border-t border-border mt-12">
          <p className="text-sm">
            יש לך שאלות? צור איתנו קשר בכתובת:{' '}
            <a href="mailto:support@parties247.co.il" className="text-accent hover:text-accent-hover font-medium">
              support@parties247.co.il
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
