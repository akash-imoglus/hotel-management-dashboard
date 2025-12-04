import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  Zap,
  X,
  Loader2,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import api from "@/lib/api";

interface ReconnectButtonProps {
  service: 'google-analytics' | 'google-ads' | 'google-search-console' | 'youtube' | 'facebook' | 'instagram' | 'meta-ads' | 'linkedin' | 'google-sheets' | 'google-drive';
  projectId: string;
  onReconnectSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

interface SelectableItem {
  id: string;
  name: string;
  category?: string;
  access_token?: string;
  customUrl?: string;
  subscriberCount?: string;
  siteUrl?: string;
}

const SERVICE_CONFIG: Record<string, {
  name: string;
  authEndpoint: string;
  itemsEndpoint: string;
  saveEndpoint: string;
  itemIdField: string;
  gradient: string;
  iconBg: string;
  icon: string;
  description: string;
  itemLabel: string;
}> = {
  'google-analytics': {
    name: 'Google Analytics',
    authEndpoint: '/google/auth',
    itemsEndpoint: '/google/properties',
    saveEndpoint: '/google/property',
    itemIdField: 'propertyId',
    gradient: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-100',
    icon: '📊',
    description: 'Track website visitors, sessions, and user behavior',
    itemLabel: 'Property'
  },
  'google-ads': {
    name: 'Google Ads',
    authEndpoint: '/google-ads/auth',
    itemsEndpoint: '/google-ads/customers',
    saveEndpoint: '/google-ads/customer',
    itemIdField: 'customerId',
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100',
    icon: '💰',
    description: 'Monitor ad campaigns, clicks, and conversions',
    itemLabel: 'Customer Account'
  },
  'google-search-console': {
    name: 'Search Console',
    authEndpoint: '/gsc/auth',
    itemsEndpoint: '/gsc/sites',
    saveEndpoint: '/gsc/site',
    itemIdField: 'siteUrl',
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-100',
    icon: '🔍',
    description: 'View search performance and SEO insights',
    itemLabel: 'Site'
  },
  'youtube': {
    name: 'YouTube',
    authEndpoint: '/youtube/auth',
    itemsEndpoint: '/youtube/channels',
    saveEndpoint: '/youtube/channel',
    itemIdField: 'channelId',
    gradient: 'from-red-500 to-rose-500',
    iconBg: 'bg-red-100',
    icon: '▶️',
    description: 'Access video analytics and channel metrics',
    itemLabel: 'Channel'
  },
  'facebook': {
    name: 'Facebook',
    authEndpoint: '/facebook/auth',
    itemsEndpoint: '/facebook/pages',
    saveEndpoint: '/facebook/page',
    itemIdField: 'pageId',
    gradient: 'from-blue-600 to-indigo-600',
    iconBg: 'bg-blue-100',
    icon: '👥',
    description: 'Sync page insights and engagement data',
    itemLabel: 'Page'
  },
  'instagram': {
    name: 'Instagram',
    authEndpoint: '/instagram/auth-url',
    itemsEndpoint: '/instagram/accounts',
    saveEndpoint: '/instagram/select',
    itemIdField: 'accountId',
    gradient: 'from-pink-500 via-purple-500 to-orange-400',
    iconBg: 'bg-pink-100',
    icon: '📸',
    description: 'Connect posts, stories, and follower analytics',
    itemLabel: 'Account'
  },
  'meta-ads': {
    name: 'Meta Ads',
    authEndpoint: '/meta-ads/auth-url',
    itemsEndpoint: '/meta-ads/accounts',
    saveEndpoint: '/meta-ads/select-account',
    itemIdField: 'accountId',
    gradient: 'from-blue-500 to-purple-600',
    iconBg: 'bg-indigo-100',
    icon: '📢',
    description: 'Track ad performance across Meta platforms',
    itemLabel: 'Ad Account'
  },
  'linkedin': {
    name: 'LinkedIn',
    authEndpoint: '/linkedin/auth-url',
    itemsEndpoint: '/linkedin/pages',
    saveEndpoint: '/linkedin/page',
    itemIdField: 'pageId',
    gradient: 'from-sky-600 to-blue-700',
    iconBg: 'bg-sky-100',
    icon: '💼',
    description: 'View company page and professional insights',
    itemLabel: 'Page'
  },
  'google-sheets': {
    name: 'Google Sheets',
    authEndpoint: '/google-sheets/auth',
    itemsEndpoint: '/google-sheets/spreadsheets',
    saveEndpoint: '/google-sheets/spreadsheet',
    itemIdField: 'spreadsheetId',
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-green-100',
    icon: '📊',
    description: 'Connect spreadsheets and data',
    itemLabel: 'Spreadsheet'
  },
  'google-drive': {
    name: 'Google Drive',
    authEndpoint: '/google-drive/auth',
    itemsEndpoint: '/google-drive/folders',
    saveEndpoint: '/google-drive/folder',
    itemIdField: 'folderId',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    icon: '💾',
    description: 'Access files and folders',
    itemLabel: 'Folder'
  },
};

type Step = 'confirm' | 'oauth' | 'select' | 'success' | 'error';

const ReconnectButton = ({
  service,
  projectId,
  onReconnectSuccess,
  variant = 'outline',
  size = 'sm',
  className = '',
}: ReconnectButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState<Step>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SelectableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const config = SERVICE_CONFIG[service];

  // Filter items based on search
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.id?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.siteUrl?.toLowerCase().includes(query)
    );
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!showDialog) {
      setStep('confirm');
      setError(null);
      setItems([]);
      setSelectedItemId('');
      setSearchQuery('');
    }
  }, [showDialog]);

  const handleStartOAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{ success: boolean; data?: { authUrl: string }; authUrl?: string }>(
        `${config.authEndpoint}?projectId=${projectId}`
      );

      const authUrl = data.authUrl || data.data?.authUrl;

      if (data.success && authUrl) {
        setStep('oauth');

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          authUrl,
          `${service}-reconnect`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );

        const checkPopup = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkPopup);
            // After OAuth, fetch items
            handleFetchItems();
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkPopup);
          if (!popup?.closed) {
            popup?.close();
          }
          setLoading(false);
        }, 300000);
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (err: any) {
      console.error(`[ReconnectButton] Error:`, err);
      setError(err.response?.data?.error || err.message || 'Failed to initiate reconnection');
      setStep('error');
      setLoading(false);
    }
  };

  const handleFetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{ success: boolean; data: any[] }>(
        `${config.itemsEndpoint}/${projectId}`
      );

      if (data.success && data.data) {
        // Normalize items to a common format
        const normalizedItems: SelectableItem[] = data.data.map((item: any) => ({
          id: item.id || item.spreadsheetId || item.folderId || item.propertyId || item.customerId || item.channelId || item.siteUrl || item.accountId || item.account_id,
          name: item.name || item.title || item.displayName || item.siteUrl || `Account ${item.id || item.spreadsheetId || item.folderId}`,
          category: item.category || item.type || (item.sheetCount ? `${item.sheetCount} sheet${item.sheetCount !== 1 ? 's' : ''}` : ''),
          access_token: item.access_token,
          customUrl: item.customUrl,
          subscriberCount: item.subscriberCount,
          siteUrl: item.siteUrl,
        }));

        setItems(normalizedItems);
        setStep('select');
      } else {
        throw new Error('No items found. Please complete authorization first.');
      }
    } catch (err: any) {
      console.error(`[ReconnectButton] Error fetching items:`, err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch available options');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedItemId) {
      setError(`Please select a ${config.itemLabel.toLowerCase()}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find selected item to get access token (for Facebook pages)
      const selectedItem = items.find(i => i.id === selectedItemId);

      const payload: any = {
        projectId,
        [config.itemIdField]: selectedItemId,
      };

      // Include page access token for Facebook
      if (service === 'facebook' && selectedItem?.access_token) {
        payload.pageAccessToken = selectedItem.access_token;
      }

      await api.post(config.saveEndpoint, payload);

      setStep('success');
      setTimeout(() => {
        setShowDialog(false);
        onReconnectSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error(`[ReconnectButton] Error saving:`, err);
      setError(err.response?.data?.error || err.message || 'Failed to save selection');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading || step === 'error') {
      setShowDialog(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        className={className}
      >
        <RefreshCcw className="h-4 w-4 mr-2" />
        Reconnect
      </Button>

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* Header */}
            <div className={`relative bg-gradient-to-br ${config.gradient} p-6 text-white`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>

              <button
                onClick={handleClose}
                disabled={loading && step !== 'error'}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-center gap-4">
                <motion.div
                  className={`w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {config.icon}
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">Reconnect {config.name}</h2>
                  <p className="text-white/80 text-sm mt-1">{config.description}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-white max-h-[60vh] overflow-y-auto">
              {/* Step: Confirm */}
              {step === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">This will:</p>
                    {[
                      { icon: ExternalLink, text: 'Open authorization window' },
                      { icon: Shield, text: 'Re-authenticate your account' },
                      { icon: Zap, text: `Let you select a ${config.itemLabel.toLowerCase()}` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm text-slate-700">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-700">
                      💡 Make sure popup blockers are disabled for this site.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartOAuth}
                      disabled={loading}
                      className={`flex-1 bg-gradient-to-r ${config.gradient} border-0`}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Start
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: OAuth */}
              {step === 'oauth' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 py-8 text-center"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
                  <div>
                    <p className="font-medium text-slate-700">Waiting for authorization...</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Complete the sign-in in the popup window
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFetchItems}
                    className="mt-4"
                  >
                    I've completed authorization
                  </Button>
                </motion.div>
              )}

              {/* Step: Select */}
              {step === 'select' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Select {config.itemLabel}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Choose which {config.itemLabel.toLowerCase()} to connect
                    </p>
                  </div>

                  {items.length > 5 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={`Search ${config.itemLabel.toLowerCase()}s...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}

                  {filteredItems.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                      {filteredItems.map((item) => {
                        const isSelected = String(selectedItemId) === String(item.id);
                        console.log('[ReconnectButton] Item:', item.id, 'Selected:', selectedItemId, 'Match:', isSelected);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              console.log('[ReconnectButton] Clicked item:', item.id, item.name);
                              setSelectedItemId(item.id);
                            }}
                            className={`w-full text-left rounded-lg border-2 p-4 transition-all ${isSelected
                                ? `border-green-600 bg-green-600 text-white shadow-md`
                                : 'border-slate-200 bg-white hover:border-green-400 hover:bg-green-50'
                              }`}
                          >
                            <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-900'
                              }`}>
                              {item.name || '(Unnamed)'}
                            </div>
                            <div className={`text-xs mt-1 ${isSelected ? 'text-white/90' : 'text-slate-500'
                              }`}>
                              ID: {item.id}
                              {item.category && ` • ${item.category}`}
                              {item.subscriberCount && ` • ${item.subscriberCount} subscribers`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      <p>No {config.itemLabel.toLowerCase()}s found</p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveSelection}
                      disabled={!selectedItemId || loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Selection
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center mx-auto shadow-lg`}>
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mt-4">
                    Successfully Connected!
                  </h3>
                  <p className="text-slate-500 mt-2">
                    Your {config.name} {config.itemLabel.toLowerCase()} has been linked.
                  </p>
                </motion.div>
              )}

              {/* Step: Error */}
              {step === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">Something went wrong</h4>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setError(null);
                        setStep('confirm');
                      }}
                      className={`flex-1 bg-gradient-to-r ${config.gradient} border-0`}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReconnectButton;
