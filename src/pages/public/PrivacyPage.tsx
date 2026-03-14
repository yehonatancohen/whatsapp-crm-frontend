export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Privacy Policy</h1>
      <p className="text-sm text-faded mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-charcoal">Account information:</strong> name, email address, and password</li>
            <li><strong className="text-charcoal">Payment information:</strong> processed securely through Stripe (we do not store card numbers)</li>
            <li><strong className="text-charcoal">Usage data:</strong> contacts, messages, campaigns, and WhatsApp account data you manage through the platform</li>
            <li><strong className="text-charcoal">Technical data:</strong> IP address, browser type, and device information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To provide and maintain the Service</li>
            <li>To process payments and manage subscriptions</li>
            <li>To send transactional emails (verification, password reset)</li>
            <li>To improve the Service and fix bugs</li>
            <li>To prevent fraud and enforce our terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">3. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-charcoal">Stripe:</strong> for payment processing</li>
            <li><strong className="text-charcoal">Resend:</strong> for transactional email delivery</li>
            <li><strong className="text-charcoal">Law enforcement:</strong> when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">4. Data Security</h2>
          <p>We use industry-standard security measures including encryption in transit (TLS), hashed passwords (bcrypt), and secure session management. However, no system is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">5. Data Retention</h2>
          <p>We retain your data for as long as your account is active. When you delete your account, we will remove your personal data within 30 days, except where required by law.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Object to data processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">7. Cookies</h2>
          <p>We use local storage for authentication tokens. We do not use third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">8. Contact</h2>
          <p>For privacy-related questions, contact us at <a href="mailto:support@parties247.co.il" className="text-accent hover:text-accent-hover">support@parties247.co.il</a></p>
        </section>
      </div>
    </div>
  );
}
