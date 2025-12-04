import { useState, useEffect, useMemo } from "react";
import { X, Link2, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/common/LoadingState";
import api from "@/lib/api";
import type { InstagramBusinessAccount } from "@/types";

interface ConnectInstagramProps {
  projectId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectInstagram = ({ projectId, onSuccess, onClose }: ConnectInstagramProps) => {
  const [step, setStep] = useState<Step>("init");
  const [accounts, setAccounts] = useState<InstagramBusinessAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramBusinessAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) {
      return accounts;
    }
    const query = searchQuery.toLowerCase().trim();
    return accounts.filter(
      (account) =>
        account.igUsername.toLowerCase().includes(query) ||
        account.pageName.toLowerCase().includes(query) ||
        account.igUserId.includes(query)
    );
  }, [accounts, searchQuery]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ success: boolean; data: InstagramBusinessAccount[] }>(
          `/instagram/accounts/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setAccounts(data.data);
          setStep("select");
        }
      } catch (err) {
        // Connection doesn't exist - stay on init step
      } finally {
        setLoading(false);
      }
    };
    void checkExistingConnection();
  }, [projectId]);

  const handleInitiateAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: { authUrl: string } }>(
        `/instagram/auth-url?projectId=${projectId}`
      );
      if (data.success && data.data.authUrl) {
        setStep("oauth");
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.data.authUrl,
          "Instagram Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "FACEBOOK_OAUTH_SUCCESS" && event.data.projectId === projectId) {
            window.removeEventListener("message", messageListener);
            handleCheckConnection();
          } else if (event.data.type === "FACEBOOK_OAUTH_ERROR") {
            window.removeEventListener("message", messageListener);
            setError(event.data.error || "OAuth authorization failed");
            setStep("init");
          }
        };
        window.addEventListener("message", messageListener);

        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageListener);
            setTimeout(() => handleCheckConnection(), 1000);
          }
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate Instagram connection");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: InstagramBusinessAccount[] }>(
        `/instagram/accounts/${projectId}`
      );
      if (data.success) {
        if (data.data.length > 0) {
          setAccounts(data.data);
          setStep("select");
        } else {
          setError("No Instagram Business Accounts found. Please ensure your Facebook Page has a linked Instagram Business Account.");
        }
      }
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Please complete the Facebook authorization in the popup window.");
      } else {
        setError(err.response?.data?.error || err.message || "Failed to fetch accounts");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!selectedAccount) {
      setError("Please select an Instagram Business Account");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ success: boolean; data: any }>("/instagram/select", {
        projectId,
        igUserId: selectedAccount.igUserId,
        igUsername: selectedAccount.igUsername,
        pageId: selectedAccount.pageId,
      });

      if (response.data.success) {
        setStep("success");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        throw new Error("Failed to save account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-hotel-navy">Connect Instagram Business</CardTitle>
            <CardDescription>
              Link your Instagram Business Account to view insights data
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "init" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  To connect Instagram Business, you'll need to:
                </p>
                <ol className="mt-2 ml-4 list-decimal space-y-2 text-sm text-slate-600">
                  <li>Authorize access to your Facebook account (with Instagram permissions)</li>
                  <li>Select your Instagram Business Account</li>
                  <li>Start viewing insights data</li>
                </ol>
              </div>
              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button
                onClick={handleInitiateAuth}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect Instagram Business
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "oauth" && (
            <div className="space-y-4">
              <LoadingState message="Waiting for Facebook authorization..." />
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  A popup window should have opened. Please authorize access to your Facebook account with Instagram permissions.
                  If the popup didn't open, check your browser's popup blocker settings.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("init")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCheckConnection} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "I've Authorized"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select Instagram Business Account
                </h3>
                <p className="text-sm text-slate-600">
                  Choose the Instagram Business Account you want to track insights for.
                </p>
              </div>
              {accounts.length === 0 ? (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  No Instagram Business Accounts found. Please ensure your Facebook Page has a linked Instagram Business Account.
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by username, page name, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No accounts found matching "{searchQuery}"</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredAccounts.map((account) => (
                        <button
                          key={account.igUserId}
                          onClick={() => setSelectedAccount(account)}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${selectedAccount?.igUserId === account.igUserId
                              ? "border-hotel-ocean bg-hotel-foam"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          <div className="font-semibold text-slate-900">@{account.igUsername}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Page: {account.pageName} | ID: {account.igUserId}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredAccounts.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Showing {filteredAccounts.length} of {accounts.length} accounts
                    </p>
                  )}
                </>
              )}
              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("init")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSaveAccount}
                  disabled={!selectedAccount || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Account"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-slate-900">
                Successfully Connected!
              </h3>
              <p className="text-slate-600">
                Your Instagram Business Account has been linked. You can now view insights data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectInstagram;

