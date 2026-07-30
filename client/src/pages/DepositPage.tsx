import { useState } from "react";
import { CreditCard, Phone, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const paymentMethods = [
  { id: "bkash", name: "bKash", color: "text-pink-500" },
  { id: "nagad", name: "Nagad", color: "text-orange-500" },
  { id: "rocket", name: "Rocket", color: "text-purple-500" },
  { id: "bank", name: "Bank Transfer", color: "text-blue-500" },
];

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const utils = trpc.useUtils();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 10) {
      toast.error("Minimum deposit amount is ৳10");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!transactionId.trim()) {
      toast.error("Please enter transaction ID");
      return;
    }
    
    setStep("confirm");
  };

  const handleConfirm = () => {
    toast.success("Deposit request submitted! It will be reviewed by admin.");
    // Reset form
    setAmount("");
    setPaymentMethod("");
    setTransactionId("");
    setStep("form");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Deposit Funds</h1>
          <p className="text-muted-foreground text-sm mt-1">Add funds to your account via payment apps</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Add Funds
          </CardTitle>
          <CardDescription>
            Send money to our payment number and submit the transaction ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (৳) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount (min ৳10)"
                    className="pl-10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method *</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <span className={method.color}>{method.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID *</label>
                <Input
                  placeholder="Enter your payment transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your {paymentMethod || "payment app"} transaction history
                </p>
              </div>

              {/* Payment Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Send payment to:</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-bold">01XXXXXXXXX</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use your own {paymentMethod || "payment app"} account to send money
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!amount || !paymentMethod || !transactionId}
              >
                Continue to Review
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800">Review Your Deposit</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Please confirm the details before submitting
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">৳{parseFloat(amount).toLocaleString('en-BD')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{paymentMethods.find(m => m.id === paymentMethod)?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">{transactionId}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("form")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleConfirm}
                >
                  Confirm Deposit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
