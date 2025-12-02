import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Table, 
  Loader2, 
  ChevronDown,
  Search,
  Download,
  RefreshCw,
  Rows,
  Columns,
  Filter
} from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ReconnectButton from "@/components/common/ReconnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ConnectGoogleSheets from "@/components/projects/ConnectGoogleSheets";
import api from "@/lib/api";
import type { Project, SpreadsheetDetails, GoogleSheet } from "@/types";

interface SheetValues {
  range: string;
  values: any[][];
}

const GoogleSheetsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [spreadsheetDetails, setSpreadsheetDetails] = useState<SpreadsheetDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Sheet data state
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [sheetData, setSheetData] = useState<SheetValues | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingProject(true);
      const response = await api.get<{ success: boolean; data: Project }>(`/projects/${projectId}`);
      const proj = response.data.data || response.data;
      setProject(proj as Project);
      setProjectError(null);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "Project not found.");
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  const fetchSpreadsheetDetails = useCallback(async () => {
    if (!projectId || !project?.googleSheetId) return;
    try {
      setLoadingDetails(true);
      const response = await api.get<{ success: boolean; data: SpreadsheetDetails }>(
        `/google-sheets/${projectId}/details`
      );
      setSpreadsheetDetails(response.data.data);
      // Auto-select first sheet
      if (response.data.data.sheets.length > 0 && !selectedSheet) {
        setSelectedSheet(response.data.data.sheets[0]);
      }
    } catch (error) {
      console.error("Failed to fetch spreadsheet details:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, [projectId, project?.googleSheetId, selectedSheet]);

  const fetchSheetData = useCallback(async () => {
    if (!projectId || !project?.googleSheetId || !selectedSheet) return;
    try {
      setLoadingData(true);
      const range = `${selectedSheet.title}!A1:Z1000`; // Fetch first 1000 rows
      const response = await api.get<{ success: boolean; data: SheetValues }>(
        `/google-sheets/${projectId}/values?range=${encodeURIComponent(range)}`
      );
      setSheetData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch sheet data:", error);
      setSheetData(null);
    } finally {
      setLoadingData(false);
    }
  }, [projectId, project?.googleSheetId, selectedSheet]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project?.googleSheetId) {
      void fetchSpreadsheetDetails();
    }
  }, [fetchSpreadsheetDetails, project?.googleSheetId]);

  useEffect(() => {
    if (selectedSheet) {
      void fetchSheetData();
    }
  }, [fetchSheetData, selectedSheet]);

  const handleConnectSuccess = () => {
    setShowConnectModal(false);
    void fetchProject();
  };

  const handleSheetSelect = (sheet: GoogleSheet) => {
    setSelectedSheet(sheet);
    setShowSheetSelector(false);
    setSearchQuery("");
  };

  // Filter data based on search
  const filteredData = sheetData?.values?.filter((row, index) => {
    if (index === 0) return true; // Always show header
    if (!searchQuery) return true;
    return row.some(cell => 
      String(cell).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const headers = filteredData[0] || [];
  const rows = filteredData.slice(1);

  if (loadingProject) {
    return <LoadingState message="Loading project..." />;
  }

  if (projectError) {
    return <ErrorState description={projectError} onRetry={fetchProject} />;
  }

  if (!project?.googleSheetId) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Google Sheets</h1>
          <p className="text-sm text-slate-500">Connect a spreadsheet to your project</p>
        </div>

        <Card className="bg-white border-2 border-dashed border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Connect Google Sheets</CardTitle>
                <CardDescription className="text-slate-500">
                  Link a spreadsheet to view and manage your data.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowConnectModal(true)} className="bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Connect Spreadsheet
            </Button>
          </CardContent>
        </Card>

        {showConnectModal && (
          <ConnectGoogleSheets
            projectId={projectId!}
            onSuccess={handleConnectSuccess}
            onClose={() => setShowConnectModal(false)}
          />
        )}
      </section>
    );
  }

  return (
    <motion.section
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25">
            <FileSpreadsheet className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {spreadsheetDetails?.title || "Google Sheets"}
            </h1>
            <p className="text-sm text-slate-500">
              {spreadsheetDetails?.sheets.length || 0} sheet(s) • {spreadsheetDetails?.timeZone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReconnectButton
            service="google-sheets"
            projectId={projectId || ''}
            onReconnectSuccess={() => window.location.reload()}
            variant="outline"
          />
          <a
            href={spreadsheetDetails?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Sheets
          </a>
          <Button variant="outline" onClick={fetchSheetData} disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sheet Selector & Search Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sheet Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSheetSelector(!showSheetSelector)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-green-300 transition-colors min-w-[200px]"
          >
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Table className="h-4 w-4 text-green-600" />
            </div>
            <span className="flex-1 text-left font-medium text-slate-900">
              {selectedSheet?.title || "Select Sheet"}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showSheetSelector ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSheetSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-500 px-2">SELECT A SHEET</p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {spreadsheetDetails?.sheets.map((sheet) => (
                    <button
                      key={sheet.sheetId}
                      onClick={() => handleSheetSelect(sheet)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedSheet?.sheetId === sheet.sheetId
                          ? 'bg-green-50 border border-green-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${
                        selectedSheet?.sheetId === sheet.sheetId
                          ? 'bg-green-500'
                          : 'bg-slate-100'
                      }`}>
                        <Table className={`h-4 w-4 ${
                          selectedSheet?.sheetId === sheet.sheetId
                            ? 'text-white'
                            : 'text-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900">{sheet.title}</p>
                        <p className="text-xs text-slate-500">
                          {sheet.rowCount.toLocaleString()} rows × {sheet.columnCount} cols
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search in data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>

        {/* Stats */}
        {sheetData && (
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Rows className="h-4 w-4" />
              <span>{rows.length.toLocaleString()} rows</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Columns className="h-4 w-4" />
              <span>{headers.length} columns</span>
            </div>
            {searchQuery && (
              <div className="flex items-center gap-1.5 text-green-600">
                <Filter className="h-4 w-4" />
                <span>Filtered</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      {loadingData || loadingDetails ? (
        <Card className="bg-white">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-green-500 animate-spin mb-4" />
              <p className="text-slate-600">Loading spreadsheet data...</p>
            </div>
          </CardContent>
        </Card>
      ) : sheetData && sheetData.values && sheetData.values.length > 0 ? (
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIndex * 0.01 }}
                    className="hover:bg-green-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {rowIndex + 1}
                    </td>
                    {headers.map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate"
                        title={String(row[colIndex] || '')}
                      >
                        {row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '' ? (
                          <span className="block truncate">
                            {String(row[colIndex])}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {rows.length.toLocaleString()} of {(sheetData.values.length - 1).toLocaleString()} rows
              {searchQuery && <span className="text-green-600"> (filtered)</span>}
            </p>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-white">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Table className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No data found</h3>
            <p className="text-slate-500 mb-4">
              {selectedSheet 
                ? `The sheet "${selectedSheet.title}" appears to be empty.`
                : "Select a sheet to view its data."
              }
            </p>
            <Button variant="outline" onClick={fetchSheetData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Spreadsheet Info Footer */}
      <Card className="bg-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Spreadsheet ID</p>
              <p className="font-mono text-sm text-slate-700">{project.googleSheetId}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowConnectModal(true)}>
              Change Spreadsheet
            </Button>
          </div>
        </CardContent>
      </Card>

      {showConnectModal && (
        <ConnectGoogleSheets
          projectId={projectId!}
          onSuccess={handleConnectSuccess}
          onClose={() => setShowConnectModal(false)}
        />
      )}
    </motion.section>
  );
};

export default GoogleSheetsPage;
