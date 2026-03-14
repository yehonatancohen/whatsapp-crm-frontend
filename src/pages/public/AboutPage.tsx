export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-charcoal mb-6">About parties247</h1>

      <div className="prose-sm space-y-4 text-muted leading-relaxed">
        <p>
          parties247 is a WhatsApp marketing and CRM platform built for businesses that want to connect
          with their customers at scale. We provide the tools to manage multiple WhatsApp accounts,
          run targeted campaigns, and engage in meaningful conversations — all from one dashboard.
        </p>

        <h2 className="text-lg font-semibold text-charcoal pt-4">Our Mission</h2>
        <p>
          We believe WhatsApp is the most powerful channel for customer communication, yet most businesses
          lack the tools to use it effectively. Our mission is to make WhatsApp marketing accessible,
          safe, and scalable for businesses of all sizes.
        </p>

        <h2 className="text-lg font-semibold text-charcoal pt-4">What We Offer</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Multi-account management with QR code authentication</li>
          <li>Smart campaign engine with rate limiting and throttling</li>
          <li>Contact management with list segmentation</li>
          <li>Number warmup to protect your accounts</li>
          <li>Unified inbox for all your conversations</li>
          <li>Real-time analytics and activity tracking</li>
        </ul>

        <h2 className="text-lg font-semibold text-charcoal pt-4">Contact</h2>
        <p>
          Have questions? Reach out to us at{' '}
          <a href="mailto:support@parties247.co.il" className="text-accent hover:text-accent-hover">
            support@parties247.co.il
          </a>
        </p>
      </div>
    </div>
  );
}
