import { useState } from "react";
import { CreditCard, Phone, CheckCircle, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const paymentMethods = [
  { id: "bkash", name: "bKash", color: "text-pink-500" },
  { id: "nagad", name: "Nagad", color: "text-orange-500" },
  { id: "rocket", name: "Rocket", color: "text-purple-500" },
];

const ADMIN_BKASH = "01338882758";
const USD_TO_BDT = 110; // 1 USD = 110 BDT
const MIN_DEPOSIT_USD = 1; // Minimum deposit is 1 USD

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const utils = trpc.useUtils();

  const requestDepositMutation = trpc.requestDeposit.useMutation({
    onSuccess: () => {
      toast.success("Deposit request submitted! It will be reviewed by admin.");
      utils.user.list.invalidate();
      // Reset form
      setAmount("");
      setPaymentMethod("");
      setUserPhone("");
      setTransactionId("");
      setStep("form");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit deposit request");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountUSD = parseFloat(amount);
    
    if (!amount || amountUSD < MIN_DEPOSIT_USD) {
      toast.error(`Minimum deposit amount is ${MIN_DEPOSIT_USD} USD (৳${MIN_DEPOSIT_USD * USD_TO_BDT} BDT)`);
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!userPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!transactionId.trim()) {
      toast.error("Please enter transaction ID");
      return;
    }

    setStep("confirm");
  };

  const handleConfirm = () => {
    // Convert USD to BDT for the API
    const amountBDT = parseFloat(amount) * USD_TO_BDT;
    requestDepositMutation.mutate({
      amount: amountBDT,
      paymentMethod,
      paymentNumber: userPhone,
      transactionId: transactionId.trim(),
    });
  };

  // Calculate BDT from USD
  const amountBDT = (parseFloat(amount) || 0) * USD_TO_BDT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Deposit Funds</h1>
          <p className="text-muted-foreground text-sm mt-1">Add funds to your account</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">How to deposit:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-700">
                <li>Send money to <strong className="font-mono">{ADMIN_BKASH}</strong> using {paymentMethod || "your preferred method"}</li>
                <li>Enter the USD amount, your phone number, and transaction ID</li>
                <li>Minimum deposit: <strong>{MIN_DEPOSIT_USD} USD</strong> (৳{MIN_DEPOSIT_USD * USD_TO_BDT} BDT)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Request Deposit
          </CardTitle>
          <CardDescription>
            Send money and submit transaction details for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Amount */}
              <div className="space-y-2">
                <Label>Amount (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder={`Min: ${MIN_DEPOSIT_USD}`}
                    className="pl-10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={MIN_DEPOSIT_USD}
                    step="0.01"
                  />
                </div>
                {amountBDT > 0 && (
                  <p className="text-sm text-emerald-600 font-medium">
                    = ৳{amountBDT.toLocaleString('en-BD')} BDT
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum deposit: {MIN_DEPOSIT_USD} USD (৳{MIN_DEPOSIT_USD * USD_TO_BDT} BDT)
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
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

              {/* User Phone Number */}
              <div className="space-y-2">
                <Label>Your Phone Number (Used for payment) *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="01XXXXXXXXX"
                    className="pl-10"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Phone number you used to send the money
                </p>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label>Transaction ID *</Label>
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
                  <span className="font-mono font-bold text-lg">{ADMIN_BKASH}</span>
                  <span className="text-xs text-muted-foreground">({paymentMethod || "bKash"})</span>
                </div>
                <p className="text-sm font-medium text-amber-600">
                  Send exactly ৳{amountBDT.toLocaleString('en-BD')} BDT ({amount || "0"} USD)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!amount || !paymentMethod || !userPhone || !transactionId}
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
                    <p className="font-medium text-emerald-800">Review Your Deposit Request</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Please confirm the details before submitting
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Amount (USD)</span>
                  <span className="font-bold">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Amount (BDT)</span>
                  <span className="font-bold">৳{amountBDT.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Your Phone</span>
                  <span className="font-mono">{userPhone}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">{transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Send to (Admin)</span>
                  <span className="font-mono font-bold">{ADMIN_BKASH}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Your deposit will be verified by admin. Once approved, the amount will be added to your account.
                </p>
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
                  disabled={requestDepositMutation.isPending}
                >
                  {requestDepositMutation.isPending ? "Submitting..." : "Confirm Request"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
