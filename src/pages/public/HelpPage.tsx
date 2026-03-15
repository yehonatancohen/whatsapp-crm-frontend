import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const faqSections: FaqSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I connect a WhatsApp account?',
        a: 'Go to the Accounts page and click "Add Account". Enter a label and scan the QR code with your phone. Open WhatsApp > Settings > Linked Devices > Link a Device.',
      },
      {
        q: 'How many accounts can I connect?',
        a: 'It depends on your plan. Starter allows 2 accounts, Pro allows 5, and Enterprise supports up to 20 accounts.',
      },
      {
        q: 'Do I need to keep my phone online?',
        a: 'WhatsApp Web requires your phone to have an internet connection. If your phone goes offline for an extended period, the session may disconnect.',
      },
    ],
  },
  {
    title: 'Contacts',
    items: [
      {
        q: 'How do I import contacts?',
        a: 'Go to the Contacts page and click "Import CSV". Upload a CSV file with columns for phone number, name, and optional tags. Phone numbers should include the country code (e.g., +972).',
      },
      {
        q: 'What format should phone numbers be in?',
        a: 'Phone numbers should include the country code prefix. For example: +972501234567, +14155551234. Numbers without a prefix will have your default country code added.',
      },
      {
        q: 'Can I organize contacts into lists?',
        a: 'Yes! You can create contact lists from the Contacts page. Use lists to segment your audience for targeted campaigns.',
      },
    ],
  },
  {
    title: 'Campaigns',
    items: [
      {
        q: 'How do I create a campaign?',
        a: 'Go to Campaigns > New Campaign. Choose between direct messages (to contacts) or group messages. Write your message template, select your target audience, and configure sending limits.',
      },
      {
        q: 'What is smart throttling?',
        a: 'Smart throttling controls how fast messages are sent to avoid getting your number flagged. You can configure messages per minute and daily limits per account.',
      },
      {
        q: 'Can I schedule campaigns?',
        a: 'Yes, you can set a scheduled date and time when creating a campaign. The campaign will start automatically at the scheduled time.',
      },
    ],
  },
  {
    title: 'Number Warmup',
    items: [
      {
        q: 'What is number warmup?',
        a: 'Number warmup gradually increases your WhatsApp sending activity to build trust with the platform. It helps prevent your number from being flagged or banned when you start sending campaigns.',
      },
      {
        q: 'How long does warmup take?',
        a: 'Warmup goes through 5 levels (L1-L5), with each level requiring a minimum number of days and messages. Full warmup typically takes 2-4 weeks depending on activity.',
      },
      {
        q: 'Should I warmup before sending campaigns?',
        a: 'Yes! We strongly recommend completing warmup to at least Level 3 before sending bulk campaigns. This significantly reduces the risk of account restrictions.',
      },
    ],
  },
  {
    title: 'Billing & Subscriptions',
    items: [
      {
        q: 'How does the free trial work?',
        a: 'Every new account gets a 7-day free trial with Starter plan features. No credit card is required to start. After the trial, you can choose a paid plan to continue.',
      },
      {
        q: 'How do I upgrade or change my plan?',
        a: 'Go to Settings > Subscription & Billing. Click "Change plan" to see available plans, or "Manage billing" to access the Stripe customer portal where you can update payment methods and view invoices.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from the billing portal. Your access continues until the end of your current billing period.',
      },
    ],
  },
];

function Accordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="text-sm font-medium text-charcoal pr-4">{item.q}</span>
        <svg
          className={`w-4 h-4 text-faded shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="text-sm text-muted pb-3.5 leading-relaxed">{item.a}</p>
      )}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Help & FAQ</h1>
      <p className="text-muted mb-10">Find answers to common questions about using שדר.</p>

      <div className="space-y-8">
        {faqSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-charcoal mb-3">{section.title}</h2>
            <div className="bg-white border border-border rounded-xl px-5">
              {section.items.map((item) => (
                <Accordion key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white border border-border rounded-xl p-6 shadow-soft text-center">
        <h3 className="text-sm font-semibold text-charcoal mb-2">Still have questions?</h3>
        <p className="text-sm text-muted mb-4">We're here to help.</p>
        <a
          href="mailto:support@parties247.co.il"
          className="inline-block bg-accent hover:bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
