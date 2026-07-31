import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useEffect } from "react";

const faqs = [
  {
    question: "What is WorkerGigBD?",
    answer: "WorkerGigBD is Bangladesh's most trusted micro-task freelancing platform. We connect workers with simple online tasks that pay real money. Whether you're a student, housewife, or anyone looking to earn extra income, WorkerGigBD is perfect for you."
  },
  {
    question: "How do I start earning on WorkerGigBD?",
    answer: "Getting started is easy! 1) Create a free account, 2) Browse available tasks, 3) Complete tasks following the instructions, 4) Earn money credited to your account. You can withdraw via bKash, Nagad, or Rocket once you reach the minimum threshold."
  },
  {
    question: "What payment methods are available?",
    answer: "We support three popular payment methods in Bangladesh: bKash, Nagad, and Rocket. You can withdraw your earnings directly to any of these accounts once you reach the minimum withdrawal amount."
  },
  {
    question: "What is the minimum withdrawal amount?",
    answer: "The minimum withdrawal amount is ৳500 (approximately $5 USD). You can withdraw via bKash, Nagad, or Rocket. Withdrawals are processed within 24-48 hours after verification."
  },
  {
    question: "Are there any fees to join WorkerGigBD?",
    answer: "No! Registration is completely free. There are no hidden charges or subscription fees. You earn 100% of what you complete. We only deduct a small processing fee for payment withdrawals."
  },
  {
    question: "How much can I earn on WorkerGigBD?",
    answer: "Your earnings depend on the tasks you complete. We have tasks ranging from ৳10 to ৳500 per task. Active workers who complete tasks daily can earn ৳5,000 to ৳20,000+ per month. There's no cap on your earnings!"
  },
  {
    question: "Do I need any experience to join?",
    answer: "No experience is required! Most of our tasks are simple and don't require any special skills. We have tasks for everyone - data entry, form filling, app testing, surveys, and more. Basic smartphone or computer knowledge is sufficient."
  },
  {
    question: "How do I receive my payments?",
    answer: "Once you've earned enough, go to the Withdraw section in your dashboard. Enter your bKash/Nagad/Rocket number and the amount. We'll verify and process your payment within 24-48 hours."
  },
  {
    question: "Is WorkerGigBD available on mobile?",
    answer: "Yes! WorkerGigBD is fully responsive and works perfectly on both mobile phones and computers. You can complete tasks, check your earnings, and withdraw money right from your smartphone."
  },
  {
    question: "How can I contact support?",
    answer: "You can reach our support team through the Help section in your dashboard or email us at support@workergigbd.com. We typically respond within 2-4 hours during business hours."
  }
];

export default function FAQPage() {
  const [, setLocation] = useLocation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = "FAQ - WorkerGigBD | Frequently Asked Questions";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Find answers to frequently asked questions about WorkerGigBD. Learn about payments, withdrawals, tasks, and how to start earning today.");
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) canonical.href = "https://workergigbd.site/faq";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about WorkerGigBD. Can't find your answer? Contact our support team.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden bg-white"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-heading font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-heading text-lg font-bold text-amber-800 mb-2">
            Still have questions?
          </h3>
          <p className="text-amber-700 mb-4">
            Our support team is here to help you 24/7
          </p>
          <Button onClick={() => setLocation("/help")} className="bg-amber-500 hover:bg-amber-600">
            Contact Support
          </Button>
        </div>
      </main>

      <footer className="bg-foreground text-white/80 py-8 mt-20">
        <div className="container text-center">
          <p className="text-sm text-white/40">&copy; 2026 WorkerGigBD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
