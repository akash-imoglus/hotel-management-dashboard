import { useEffect, useMemo, useState } from "react";
import { X, FileSpreadsheet, Search, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Spreadsheet {
  spreadsheetId: string;
  title: string;
  sheetCount: number;
  url: string;
}

interface ConnectGoogleSheetsProps {
  projectId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

type Step = "init" | "oauth" | "select" | "success";

const ConnectGoogleSheets = ({ projectId, onSuccess, onClose }: ConnectGoogleSheetsProps) => {
  const [step, setStep] = useState<Step>("init");
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSpreadsheets = useMemo(() => {
    if (!searchQuery.trim()) {
      return spreadsheets;
    }
    const query = searchQuery.toLowerCase().trim();
    return spreadsheets.filter(
      (sheet) =>
        sheet.title.toLowerCase().includes(query) ||
        sheet.spreadsheetId.includes(query)
    );
  }, [spreadsheets, searchQuery]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ success: boolean; data: Spreadsheet[] }>(
          `/google-sheets/spreadsheets/${projectId}`
        );
        if (data.success && data.data.length > 0) {
          setSpreadsheets(data.data);
          setStep("select");
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || "";
        if (errorMessage.includes("Google Sheets API") || errorMessage.includes("not been used") || errorMessage.includes("disabled")) {
          setError("⚠️ Google Sheets API is not enabled. Please enable it in your Google Cloud Console.");
        }
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
      const { data } = await api.get<{ success: boolean; authUrl: string }>(
        `/google-sheets/auth?projectId=${projectId}`
      );
      if (data.success && data.authUrl) {
        setStep("oauth");
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.authUrl,
          "Google Sheets Authorization",
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        const checkPopup = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            try {
              const { data: sheetsData } = await api.get<{ success: boolean; data: Spreadsheet[] }>(
                `/google-sheets/spreadsheets/${projectId}`
              );
              if (sheetsData.success && sheetsData.data.length > 0) {
                setSpreadsheets(sheetsData.data);
                setStep("select");
              } else {
                setStep("init");
                setError("Authorization was cancelled or failed. Please try again.");
              }
            } catch (e) {
              setStep("init");
              setError("Failed to fetch spreadsheets after authorization.");
            }
            setLoading(false);
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  const handleSaveSpreadsheet = async () => {
    if (!selectedSpreadsheetId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/google-sheets/spreadsheet', {
        projectId,
        spreadsheetId: selectedSpreadsheetId,
      });

      setStep("success");
      
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-slate-900">Connect Google Sheets</CardTitle>
              <CardDescription className="text-slate-500">
                Link a spreadsheet to your project
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-slate-500" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === "init" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-green-50 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Connect Google Sheets</h3>
                <p className="text-sm text-slate-600 max-w-md">
                  Authorize access to your Google Sheets to view and manage spreadsheet data.
                </p>
              </div>
              <Button
                onClick={handleInitiateAuth}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Connect with Google
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "oauth" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Authorizing...</h3>
                <p className="text-sm text-slate-600">
                  Complete the authorization in the popup window.
                </p>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search spreadsheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredSpreadsheets.length === 0 ? (
                  <p className="text-center py-4 text-slate-500">No spreadsheets found</p>
                ) : (
                  filteredSpreadsheets.map((sheet) => (
                    <div
                      key={sheet.spreadsheetId}
                      onClick={() => setSelectedSpreadsheetId(sheet.spreadsheetId)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSpreadsheetId === sheet.spreadsheetId
                          ? "border-green-600 bg-green-600 shadow-md"
                          : "border-slate-200 bg-white hover:border-green-400 hover:bg-green-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className={`h-5 w-5 flex-shrink-0 ${
                          selectedSpreadsheetId === sheet.spreadsheetId
                            ? "text-white"
                            : "text-green-600"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            selectedSpreadsheetId === sheet.spreadsheetId
                              ? "text-white"
                              : "text-slate-900"
                          }`}>
                            {sheet.title}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${
                            selectedSpreadsheetId === sheet.spreadsheetId
                              ? "text-green-100"
                              : "text-slate-500"
                          }`}>
                            {sheet.sheetCount} sheet{sheet.sheetCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {selectedSpreadsheetId === sheet.spreadsheetId && (
                          <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1 text-slate-900">Google Sheets Connected!</h3>
                <p className="text-sm text-slate-600">
                  Your spreadsheet has been linked successfully.
                </p>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSpreadsheet}
                disabled={!selectedSpreadsheetId || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Spreadsheet"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectGoogleSheets;





