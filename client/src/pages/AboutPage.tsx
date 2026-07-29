import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
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
        <h1 className="font-heading text-4xl font-bold text-foreground mb-6">About WorkerGigBD</h1>
        <div className="prose prose-lg text-muted-foreground max-w-none">
          <p className="text-lg leading-relaxed mb-6">
            WorkerGigBD is a premium freelancing platform designed to connect skilled workers with micro-task opportunities. 
            Our mission is to empower individuals with accessible earning opportunities that fit their schedule and skillset.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10 mb-4">Our Mission</h2>
          <p className="leading-relaxed mb-6">
            We believe that everyone deserves access to flexible earning opportunities. Whether you're a student looking for 
            side income, a stay-at-home parent seeking flexible work, or a professional wanting to monetize extra skills — 
            WorkerGigBD provides the platform to make it happen.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10 mb-4">What We Offer</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Micro-tasks that pay real money</li>
            <li>Flexible scheduling — work when you want</li>
            <li>Multiple payment methods</li>
            <li>Transparent earning tracking</li>
            <li>Community support and guidance</li>
            <li>Secure and reliable platform</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10 mb-4">How It Works</h2>
          <p className="leading-relaxed mb-4">
            WorkerGigBD operates on a simple principle: complete tasks, earn money. Our platform aggregates micro-tasks 
            from various sources and presents them in an easy-to-navigate interface. Workers can browse available tasks, 
            complete them according to the instructions, and receive payment directly to their account.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Transparency</strong> — Clear payment terms and honest communication</li>
            <li><strong>Fairness</strong> — Equal opportunity for all workers</li>
            <li><strong>Security</strong> — Your data and earnings are protected</li>
            <li><strong>Quality</strong> — We maintain high standards for both tasks and payments</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10 mb-4">Contact Us</h2>
          <p className="leading-relaxed">
            For support inquiries, please reach out to us at support@workergigbd.com or use the in-app support system 
            to get help from our team.
          </p>
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
