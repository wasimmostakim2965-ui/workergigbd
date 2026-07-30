import { useState } from "react";
import { HelpCircle, MessageCircle, Mail, Phone, Book, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const faqs = [
  {
    question: "How do I start earning?",
    answer: "Sign up for an account, browse available jobs on the dashboard, and click 'Start' on any job to begin earning. Complete tasks and earn money directly to your account."
  },
  {
    question: "How do I withdraw my earnings?",
    answer: "Go to the Withdraw page, enter the amount you want to withdraw (minimum ৳500), select your payment method (bKash/Nagad/Rocket), and submit. Withdrawals are processed within 24-48 hours."
  },
  {
    question: "What payment methods are supported?",
    answer: "We currently support bKash, Nagad, Rocket, and Bank Transfer. You can set your preferred payment method in your profile settings."
  },
  {
    question: "How do I deposit funds?",
    answer: "Go to the Deposit page, enter the amount, select your payment method, and send money to our payment number. Then submit the transaction ID. Admin will verify and add funds to your account."
  },
  {
    question: "Why is my email verification important?",
    answer: "Email verification is required before you can request withdrawals. This ensures the security of your account and prevents unauthorized withdrawals."
  },
  {
    question: "How do I contact support?",
    answer: "You can contact us through the support form below, email us at support@workergigbd.com, or message us on our social media pages."
  },
  {
    question: "What happens if I complete a job?",
    answer: "Once you complete a job task, the earnings are added to your pending balance. After admin verification, the amount becomes available for withdrawal."
  },
  {
    question: "Can I have multiple accounts?",
    answer: "No, each user is allowed only one account. Multiple accounts will be banned and funds may be forfeited."
  }
];

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Support ticket submitted! We'll respond within 24 hours.");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground text-sm mt-1">Find answers and get in touch with us</p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Email Us</p>
              <p className="text-sm text-muted-foreground">support@workergigbd.com</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Live Chat</p>
              <p className="text-sm text-muted-foreground">Available 9AM - 9PM</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">+880 1XXX-XXXXXX</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-500" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Find quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <span className="font-medium pr-4">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Support Ticket Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-amber-500" />
            Submit a Support Ticket
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="How can we help?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-between">
            Terms of Service
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Privacy Policy
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Community Guidelines
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
