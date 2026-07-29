import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container py-16 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: January 2026</p>
        
        <div className="prose prose-lg text-muted-foreground max-w-none space-y-6">
          <h2 className="font-heading text-xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including your name, email address, phone number, and payment details when you create an account or use our services.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate, maintain, and improve our services, process transactions, send communications, and ensure security of our platform.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">3. Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">4. Data Security</h2>
          <p>We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">5. Cookies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">6. Third-Party Links</h2>
          <p>Our service may contain links to other sites. We advise you to review the Privacy Policy of every site you visit.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">7. Changes to This Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@workergigbd.com.</p>
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
