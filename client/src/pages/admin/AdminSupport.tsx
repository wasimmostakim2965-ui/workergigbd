import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Mail, User, Clock, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";

export default function AdminSupport() {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "responded" | "resolved">("all");

  const { data: messages, refetch } = trpc.admin.supportMessages.useQuery();
  const respondMutation = trpc.admin.respondToSupport.useMutation({
    onSuccess: () => {
      toast.success("Response sent successfully!");
      setResponse("");
      setSelectedMessage(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send response");
    },
  });

  const filteredMessages = messages?.filter((msg: any) => {
    if (filter === "all") return true;
    return msg.status === filter;
  }) || [];

  const handleRespond = (status: "responded" | "resolved") => {
    if (!selectedMessage || !response.trim()) {
      toast.error("Please enter a response");
      return;
    }
    respondMutation.mutate({
      id: selectedMessage.id,
      response,
      status,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500 text-white"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "responded":
        return <Badge className="bg-blue-500 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Responded</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-500 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Support Messages</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage user support requests</p>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "responded", "resolved"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f as any)}
              className={filter === f ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Messages ({filteredMessages.length})
            </CardTitle>
            <CardDescription>Click on a message to view details and respond</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                filteredMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedMessage?.id === msg.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-border hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setResponse(msg.adminResponse || "");
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-sm truncate">{msg.userName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{msg.subject || "General Inquiry"}</p>
                        <p className="text-sm mt-1 line-clamp-2">{msg.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(msg.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Detail / Response */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              {selectedMessage ? "Reply to Message" : "Select a Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMessage ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a message from the list to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Original Message */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{selectedMessage.userName}</span>
                      {selectedMessage.userEmail && (
                        <span className="text-xs text-muted-foreground">({selectedMessage.userEmail})</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {selectedMessage.subject && (
                    <p className="text-sm font-medium mb-1">{selectedMessage.subject}</p>
                  )}
                  <p className="text-sm">{selectedMessage.message}</p>
                </div>

                {/* Previous Admin Response */}
                {selectedMessage.adminResponse && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700">Your Previous Response</span>
                    </div>
                    <p className="text-sm text-emerald-800">{selectedMessage.adminResponse}</p>
                  </div>
                )}

                {/* Response Form */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Your Response</Label>
                    <Textarea
                      placeholder="Type your response here..."
                      rows={4}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRespond("responded")}
                      disabled={!response.trim() || respondMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => handleRespond("resolved")}
                      disabled={!response.trim() || respondMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
