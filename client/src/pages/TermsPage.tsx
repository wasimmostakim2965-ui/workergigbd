import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: January 2026</p>
        
        <div className="prose prose-lg text-muted-foreground max-w-none space-y-6">
          <h2 className="font-heading text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing and using WorkerGigBD, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, please do not use our services.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">2. Eligibility</h2>
          <p>You must be at least 18 years old to use WorkerGigBD. By using our platform, you represent and warrant that you meet this requirement.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">3. Account Registration</h2>
          <p>Users must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">4. User Obligations</h2>
          <p>Users must complete tasks honestly and accurately. Fraudulent activity, multiple accounts, or manipulation of the system will result in immediate termination and forfeiture of earnings.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">5. Payment Terms</h2>
          <p>Payments are processed according to our payment schedule. Withdrawal requests are subject to verification and may take up to 7 business days to process.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">6. Intellectual Property</h2>
          <p>All content on WorkerGigBD is protected by intellectual property laws. Users may not reproduce, distribute, or create derivative works without permission.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">7. Limitation of Liability</h2>
          <p>WorkerGigBD shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">8. Termination</h2>
          <p>We reserve the right to terminate or suspend your account at any time for violation of these terms.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">9. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of Bangladesh.</p>

          <h2 className="font-heading text-xl font-bold text-foreground">10. Contact</h2>
          <p>For questions about these Terms, contact us at legal@workergigbd.com.</p>
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
