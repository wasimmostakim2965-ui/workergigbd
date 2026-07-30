import { useState } from "react";
import { DollarSign, Phone, AlertCircle, CheckCircle } from "lucide-react";
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

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const { data: balance } = trpc.earnings.balance.useQuery();
  const { data: emailVerified } = trpc.auth.me.useQuery();
  
  const withdraw = trpc.earnings.withdraw.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully!");
      setAmount("");
      setPaymentMethod("");
      setPaymentNumber("");
      setStep("form");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const availableBalance = Number(balance?.earning || 0);
  const minWithdraw = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availableBalance < minWithdraw) {
      toast.error(`Minimum withdrawal amount is ৳${minWithdraw}`);
      return;
    }
    if (parseFloat(amount) > availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!paymentNumber.trim()) {
      toast.error("Please enter payment number");
      return;
    }
    
    setStep("confirm");
  };

  const handleConfirm = () => {
    withdraw.mutate({
      amount: parseFloat(amount),
      paymentMethod,
      paymentNumber,
    });
  };

  if (!emailVerified?.emailVerified) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Withdraw Funds</h1>
            <p className="text-muted-foreground text-sm mt-1">Transfer earnings to your mobile banking</p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Email Verification Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  You need to verify your email before requesting a withdrawal.
                  Please check your email for the verification link.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-amber-300 text-amber-700"
                  onClick={() => {
                    trpc.auth.resendVerification.useMutation().mutate();
                    toast.success("Verification email sent!");
                  }}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-muted-foreground text-sm mt-1">Transfer earnings to your mobile banking</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
        <CardContent className="p-6">
          <p className="text-emerald-100 text-sm">Available Balance</p>
          <p className="text-3xl font-bold mt-1">৳{availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 0 })}</p>
          <p className="text-xs text-emerald-200 mt-2">Minimum withdrawal: ৳{minWithdraw}</p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Enter the amount and payment details to withdraw
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Withdrawal Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (৳) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder={`Enter amount (min ৳${minWithdraw})`}
                    className="pl-10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={minWithdraw}
                    max={availableBalance}
                  />
                </div>
                {parseFloat(amount) > availableBalance && (
                  <p className="text-xs text-red-500">Amount exceeds available balance</p>
                )}
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

              {/* Payment Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    className="pl-10"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                disabled={
                  !amount || 
                  parseFloat(amount) < minWithdraw || 
                  parseFloat(amount) > availableBalance || 
                  !paymentMethod || 
                  !paymentNumber ||
                  withdraw.isPending
                }
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
                    <p className="font-medium text-emerald-800">Review Withdrawal</p>
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
                  <span className="text-muted-foreground">Payment Number</span>
                  <span className="font-mono">{paymentNumber}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Processing Time</span>
                  <span className="text-sm">24-48 hours</span>
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
                  disabled={withdraw.isPending}
                >
                  {withdraw.isPending ? "Processing..." : "Confirm Withdrawal"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
