import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "About Us - WorkerGigBD | Bangladesh's #1 Micro-Task Platform";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Learn about WorkerGigBD - Bangladesh's most trusted micro-task freelancing platform. Our mission is to empower individuals with flexible earning opportunities. Get paid via bKash, Nagad, Rocket.");
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) canonical.href = "https://workergigbd.site/about";
  }, []);

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
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">About WorkerGigBD</h1>
        <p className="text-sm text-muted-foreground mb-8">Your trusted partner in earning opportunities</p>
        
        <div className="prose prose-lg text-muted-foreground max-w-none space-y-6">
          <p className="text-lg leading-relaxed">
            Welcome to <strong>WorkerGigBD</strong> — Bangladesh's most trusted micro-task freelancing platform. 
            We are dedicated to creating meaningful earning opportunities for people across Bangladesh.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">Our Mission</h2>
          <p className="leading-relaxed">
            We believe that everyone deserves access to flexible earning opportunities. Whether you're a student looking for 
            side income, a stay-at-home parent seeking flexible work, or a professional wanting to monetize extra skills — 
            WorkerGigBD provides the platform to make it happen.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Micro-tasks that pay real money</li>
            <li>Flexible scheduling — work when you want</li>
            <li>Multiple payment methods (bKash, Nagad, Rocket)</li>
            <li>Transparent earning tracking</li>
            <li>Community support and guidance</li>
            <li>Secure and reliable platform</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">How It Works</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li><strong>Sign Up</strong> — Create your free account in seconds</li>
            <li><strong>Browse Tasks</strong> — Choose from hundreds of available micro-tasks</li>
            <li><strong>Complete Tasks</strong> — Follow instructions and submit your work</li>
            <li><strong>Earn Money</strong> — Get paid directly to your bKash, Nagad, or Rocket account</li>
          </ol>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">Our Values</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Transparency</strong> — Clear payment terms and honest communication</li>
            <li><strong>Fairness</strong> — Equal opportunity for all workers</li>
            <li><strong>Security</strong> — Your data and earnings are protected</li>
            <li><strong>Quality</strong> — We maintain high standards for both tasks and payments</li>
          </ul>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">Why Choose WorkerGigBD?</h2>
          <p className="leading-relaxed">
            Unlike other platforms, WorkerGigBD is designed specifically for the Bangladeshi market. We understand the 
            needs of our workers and have built a platform that prioritizes their success. With instant payments via 
            bKash, Nagad, and Rocket, you can withdraw your earnings quickly and easily.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground mt-10">Contact Us</h2>
          <p className="leading-relaxed">
            Have questions? We're here to help! Reach out to us at <a href="mailto:support@workergigbd.com" className="text-primary underline">support@workergigbd.com</a> 
            or use the in-app support system to get help from our dedicated team.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
            <h3 className="font-heading text-lg font-bold text-amber-800 mb-2">Ready to Start Earning?</h3>
            <p className="text-amber-700 mb-4">Join thousands of workers who are already earning with WorkerGigBD.</p>
            <Button onClick={() => setLocation("/register")} className="bg-amber-500 hover:bg-amber-600">
              Create Free Account
            </Button>
          </div>
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
