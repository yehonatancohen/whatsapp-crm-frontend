export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Terms of Service</h1>
      <p className="text-sm text-faded mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using parties247 ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">2. Description of Service</h2>
          <p>parties247 provides a WhatsApp marketing and CRM platform that allows users to manage WhatsApp accounts, send messages, manage contacts, and run campaigns. The Service is provided "as is" and may be updated from time to time.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">3. User Accounts</h2>
          <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials. You must not share your account with others or allow unauthorized access.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Send spam or unsolicited messages</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, threaten, or harm others</li>
            <li>Distribute malware or phishing content</li>
            <li>Violate WhatsApp's Terms of Service</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">5. Subscriptions & Billing</h2>
          <p>Paid features are available through subscription plans. Subscriptions auto-renew unless canceled. Refunds are handled on a case-by-case basis. We reserve the right to change pricing with 30 days notice.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">6. Termination</h2>
          <p>We may suspend or terminate your account if you violate these terms. You may cancel your account at any time through your account settings. Upon termination, your data will be deleted within 30 days.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">7. Limitation of Liability</h2>
          <p>The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">8. Changes to Terms</h2>
          <p>We may update these terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-charcoal mb-2">9. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:support@parties247.co.il" className="text-accent hover:text-accent-hover">support@parties247.co.il</a></p>
        </section>
      </div>
    </div>
  );
}
