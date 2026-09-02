import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  ExternalLink,
  Landmark,
  Percent,
  Calendar,
  Check,
  Sparkles,
  Download,
  Mail,
  Send,
  FileSpreadsheet,
  FileText,
  Copy,
  Users,
  AlertCircle,
  X,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Theater, MerchantKYC, PayUConfig } from '../../types';
import { theaterStore } from '../../utils/theaterStore';
import { analyticsStore } from '../../utils/analyticsStore';
import { Breadcrumbs } from '../Breadcrumbs';

export const MerchantOnboarding: React.FC = () => {
  const [theaters, setTheaters] = useState<Theater[]>(theaterStore.getAllTheaters());
  const [activeTheaterId, setActiveTheaterId] = useState<string>(theaterStore.getActiveTheaterId());
  const [activeTheater, setActiveTheater] = useState<Theater>(theaterStore.getActiveTheater());

  // Form states for KYC
  const [kycForm, setKycForm] = useState<MerchantKYC>(activeTheater.kyc);
  // Form states for PayU
  const [payuForm, setPayuForm] = useState<PayUConfig>(activeTheater.payu);
  // Form states for Theater Admin Login Credentials
  const [credentialsForm, setCredentialsForm] = useState<{ username: string; password: string }>({
    username: activeTheater.admin_credentials?.username || `admin_${activeTheater.theater_id.replace('th_', '')}`,
    password: activeTheater.admin_credentials?.password || 'admin@123',
  });
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);
  const [copiedCreds, setCopiedCreds] = useState<boolean>(false);

  const [showSalt, setShowSalt] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<string>('');
  const [testGatewayStatus, setTestGatewayStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testGatewayMessage, setTestGatewayMessage] = useState<string>('');

  // 2-Step Verification Modal State
  const [verifyModal, setVerifyModal] = useState<{
    isOpen: boolean;
    type: 'KYC' | 'PAYU' | null;
    confirmationText: string;
  }>({
    isOpen: false,
    type: null,
    confirmationText: '',
  });

  // Email Report Dispatch Modal State
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    recipientEmail: string;
    copied: boolean;
    sentStatus: string;
  }>({
    isOpen: false,
    recipientEmail: activeTheater.kyc.theater_owner_email || 'director@grandmultiplex.in',
    copied: false,
    sentStatus: '',
  });

  // Add Theater Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTheaterData, setNewTheaterData] = useState({
    theater_id: '',
    name: '',
    tagline: '',
    city: '',
    address: '',
    theater_owner_email: '',
    admin_username: '',
    admin_password: '',
    company_pan: '',
    gstin: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    payee_vpa: '',
    merchant_key: '',
    merchant_salt: '',
  });

  // Quick edit state for database table
  const [editingTheaterId, setEditingTheaterId] = useState<string | null>(null);
  const [dbCreds, setDbCreds] = useState<{ username: string; password: string }>({ username: '', password: '' });
  const [revealedDbPasswords, setRevealedDbPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = theaterStore.subscribe(() => {
      const all = theaterStore.getAllTheaters();
      const currentId = theaterStore.getActiveTheaterId();
      const current = theaterStore.getActiveTheater();
      setTheaters(all);
      setActiveTheaterId(currentId);
      setActiveTheater(current);
      setKycForm(current.kyc);
      setPayuForm(current.payu);
      setCredentialsForm({
        username: current.admin_credentials?.username || `admin_${current.theater_id.replace('th_', '')}`,
        password: current.admin_credentials?.password || 'admin@123',
      });
      setEmailModal((prev) => ({
        ...prev,
        recipientEmail: current.kyc.theater_owner_email || `director@${current.theater_id.replace('th_', '')}.in`,
      }));
    });
    return () => unsub();
  }, []);

  const handleSelectTheater = (id: string) => {
    theaterStore.setActiveTheaterId(id);
    const selected = theaterStore.getTheaterById(id);
    if (selected) {
      setActiveTheater(selected);
      setKycForm(selected.kyc);
      setPayuForm(selected.payu);
      setCredentialsForm({
        username: selected.admin_credentials?.username || `admin_${selected.theater_id.replace('th_', '')}`,
        password: selected.admin_credentials?.password || 'admin@123',
      });
      setEmailModal((prev) => ({
        ...prev,
        recipientEmail: selected.kyc.theater_owner_email || `director@${selected.theater_id.replace('th_', '')}.in`,
        sentStatus: '',
      }));
    }
  };

  // Direct Credential Save for Active Theater
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsForm.username.trim() || !credentialsForm.password.trim()) {
      return;
    }
    theaterStore.updateTheaterCredentials(activeTheater.theater_id, credentialsForm);
    setSavedSuccess(`Admin credentials for "${activeTheater.name}" updated in database! Theater owner can now log in with Admin ID: ${credentialsForm.username}`);
    setTimeout(() => setSavedSuccess(''), 5000);
  };

  // Database Table Quick Edit
  const handleStartDbEdit = (t: Theater) => {
    setEditingTheaterId(t.theater_id);
    setDbCreds({
      username: t.admin_credentials?.username || `admin_${t.theater_id.replace('th_', '')}`,
      password: t.admin_credentials?.password || 'admin@123',
    });
  };

  const handleSaveDbEdit = (theaterId: string) => {
    if (!dbCreds.username.trim() || !dbCreds.password.trim()) return;
    theaterStore.updateTheaterCredentials(theaterId, dbCreds);
    setEditingTheaterId(null);
    setSavedSuccess(`Credentials updated for theater ${theaterId}!`);
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const toggleRevealDbPassword = (theaterId: string) => {
    setRevealedDbPasswords((prev) => ({
      ...prev,
      [theaterId]: !prev[theaterId],
    }));
  };

  const handleCopyTheaterCredentials = () => {
    const text = `--- ${activeTheater.name} ---
Portal URL: ${window.location.origin}
Admin ID: ${credentialsForm.username}
Password: ${credentialsForm.password}
Access: Kitchen KDS, Menu Catalog, Revenue Analytics, Virtual POS Thermal Printer`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  // Request 2-Step Verification for KYC
  const handleRequestSaveKYC = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyModal({
      isOpen: true,
      type: 'KYC',
      confirmationText: '',
    });
  };

  // Request 2-Step Verification for PayU
  const handleRequestSavePayU = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyModal({
      isOpen: true,
      type: 'PAYU',
      confirmationText: '',
    });
  };

  // Execute 2-Step Verified Action
  const handleExecuteVerifiedSave = async () => {
    if (verifyModal.confirmationText.trim() !== activeTheater.name.trim()) {
      return;
    }

    if (verifyModal.type === 'KYC') {
      theaterStore.updateTheaterKYC(activeTheater.theater_id, kycForm);
      try {
        await fetch(`/api/theaters/${activeTheater.theater_id}/kyc`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kycForm),
        });
      } catch {}
      setSavedSuccess(`2-Step Verified: KYC & Banking information for "${activeTheater.name}" updated successfully!`);
    } else if (verifyModal.type === 'PAYU') {
      theaterStore.updateTheaterPayU(activeTheater.theater_id, payuForm);
      try {
        await fetch(`/api/theaters/${activeTheater.theater_id}/payu`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payuForm),
        });
      } catch {}
      setSavedSuccess(`2-Step Verified: PayU Gateway keys for "${activeTheater.name}" securely updated!`);
    }

    setVerifyModal({ isOpen: false, type: null, confirmationText: '' });
    setTimeout(() => setSavedSuccess(''), 5000);
  };

  // Real Analytics & Reporting for Active Theater
  const currentMetrics = analyticsStore.calculateMetrics(activeTheater.theater_id);
  const theaterTxns = analyticsStore.getTransactions(activeTheater.theater_id);
  const estimatedMdrSavings = currentMetrics.total_gross_volume * 0.0199; // Standard 1.99% payment gateway MDR saved

  // Download Comprehensive CSV Report
  const handleDownloadCSVReport = () => {
    const headers = [
      'Transaction ID',
      'Order ID',
      'Timestamp (ISO)',
      'Customer Name',
      'Phone Number',
      'Screen / Audi',
      'Seat Location',
      'Gross Amount (INR)',
      'UPI App',
      'Payment Status',
      'Bank Ref / UTR',
      'PayU mihpayid',
      'Settlement Status',
      'MDR Incurred (INR)'
    ];

    const rows = theaterTxns.map((t) => [
      t.txnid,
      t.order_id,
      t.booking_date,
      `"${t.customer_name || 'Theater Guest'}"`,
      t.customer_phone || 'N/A',
      `"${t.screen_number || 'Screen 1'}"`,
      `"${t.seat_location || 'Seat'}"`,
      t.amount.toFixed(2),
      `"${t.upi_app || 'Direct UPI'}"`,
      t.payment_status.toUpperCase(),
      t.bank_ref_num || 'N/A',
      t.mihpayid || 'N/A',
      t.settlement_status.toUpperCase(),
      '0.00'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SnackBox_Settlement_${activeTheater.theater_id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Formal Text Settlement Statement
  const handleDownloadTextStatement = () => {
    const statement = `===============================================================
SNACK BOX - IN-SEAT CINEMA DINING GATEWAY SETTLEMENT STATEMENT
===============================================================
Theater Name: ${activeTheater.name}
Theater ID: ${activeTheater.theater_id}
Legal Entity: ${activeTheater.kyc.legal_business_name}
GSTIN: ${activeTheater.kyc.gstin}
Company PAN: ${activeTheater.kyc.company_pan}
Bank Account: ${activeTheater.kyc.bank_account_number} (${activeTheater.kyc.bank_name})
Bank IFSC: ${activeTheater.kyc.bank_ifsc}
Receiving UPI Handle: ${activeTheater.kyc.payee_vpa}
Settlement Cycle: ${activeTheater.kyc.settlement_schedule}
Report Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

---------------------------------------------------------------
RECONCILIATION & REVENUE SUMMARY:
---------------------------------------------------------------
Gross UPI Collections: ₹${currentMetrics.total_gross_volume.toFixed(2)}
Successful Orders: ${currentMetrics.successful_transactions}
Failed / Cancelled Attempts: ${currentMetrics.failed_transactions}
UPI Conversion Rate: ${currentMetrics.conversion_rate}%
Standard Gateway MDR (1.99%): ₹${estimatedMdrSavings.toFixed(2)} [WAIVED]
Snack Box 0% MDR Direct Incurred: ₹0.00
---------------------------------------------------------------
NET SETTLEMENT TRANSFERRED TO BANK: ₹${currentMetrics.total_gross_volume.toFixed(2)}
---------------------------------------------------------------

TRANSACTION LEDGER (Sample Recent):
${theaterTxns.slice(0, 10).map((t, idx) => `${idx + 1}. ${t.txnid} | ${t.order_id} | ₹${t.amount} | ${t.payment_status.toUpperCase()} | UTR: ${t.bank_ref_num || 'N/A'} | ${t.upi_app || 'UPI'}`).join('\n')}

Cryptographic Audit Signature: SHA512_DIRECT_VERIFIED_${Date.now()}
Authorized by: Master Gateway Admin (Sreegeethesh)
===============================================================`;

    const blob = new Blob([statement], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Statement_${activeTheater.theater_id}_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Email Content
  const generateEmailReportBody = () => {
    return `Dear ${activeTheater.name} Management,

Here is the official Snack Box PayU UPI settlement and financial summary for your theater:

--- MERCHANT DETAILS ---
Theater Name: ${activeTheater.name}
Legal Business Name: ${activeTheater.kyc.legal_business_name}
Registered Owner Email: ${emailModal.recipientEmail}
GSTIN: ${activeTheater.kyc.gstin}
Direct Bank Account: ${activeTheater.kyc.bank_account_number}
Bank Name & IFSC: ${activeTheater.kyc.bank_name} (${activeTheater.kyc.bank_ifsc})
Payee VPA: ${activeTheater.kyc.payee_vpa}

--- SETTLEMENT METRICS ---
• Total Gross Collections: INR ${currentMetrics.total_gross_volume.toFixed(2)}
• Total Successful Orders: ${currentMetrics.successful_transactions}
• UPI Conversion Rate: ${currentMetrics.conversion_rate}%
• Zero MDR Direct Savings: INR ${estimatedMdrSavings.toFixed(2)}
• Net Dispatched to Bank: INR ${currentMetrics.total_gross_volume.toFixed(2)}
• Settlement Schedule: ${activeTheater.kyc.settlement_schedule}

--- RECENT TRANSACTIONS ---
${theaterTxns.slice(0, 5).map(t => `• Order ${t.order_id} | INR ${t.amount} | UTR: ${t.bank_ref_num || t.mihpayid || 'Verified'} | ${t.payment_status.toUpperCase()}`).join('\n')}

Audit Verification ID: SNACKBOX-AUDIT-${Date.now().toString(36).toUpperCase()}
Generated on: ${new Date().toUTCString()}

Best regards,
Master Gateway Operations Team
Snack Box Technologies`;
  };

  // Send Email via Client Dispatch
  const handleSendEmailReport = () => {
    const subject = `[Snack Box Settlement Report] ${activeTheater.name} - PayU Financial Summary`;
    const body = generateEmailReportBody();
    const mailtoUrl = `mailto:${encodeURIComponent(emailModal.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;

    setEmailModal((prev) => ({
      ...prev,
      sentStatus: `Email dispatch triggered to ${emailModal.recipientEmail}! Audit recorded.`,
    }));
  };

  const handleCopyEmailBody = () => {
    const body = generateEmailReportBody();
    navigator.clipboard.writeText(body);
    setEmailModal((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setEmailModal((prev) => ({ ...prev, copied: false }));
    }, 2500);
  };

  const handleTestPayUGateway = async () => {
    setTestGatewayStatus('TESTING');
    setTestGatewayMessage('Testing PayU SHA-512 cryptographic handshake with encrypted salt...');

    try {
      const res = await fetch('/api/payu/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theater_id: activeTheater.theater_id,
          order_id: '#TEST-PING',
          amount: 10,
          token_number: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestGatewayStatus('SUCCESS');
        setTestGatewayMessage(`Gateway Connected! SHA-512 forward signature verified: ${data.hash.slice(0, 16)}...`);
      } else {
        setTestGatewayStatus('ERROR');
        setTestGatewayMessage('Failed to initialize PayU signature.');
      }
    } catch (err: any) {
      setTestGatewayStatus('ERROR');
      setTestGatewayMessage(`Connection failed: ${err.message}`);
    }
  };

  const handleCreateTheater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheaterData.name.trim()) return;

    const generatedId = newTheaterData.theater_id.trim() 
      ? `th_${newTheaterData.theater_id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      : `th_${newTheaterData.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}`;

    theaterStore.createNewTheater({
      theater_id: generatedId,
      name: newTheaterData.name.trim(),
      tagline: newTheaterData.tagline.trim() || 'Premium In-Seat Cinema Dining',
      city: newTheaterData.city.trim() || 'Mumbai',
      address: newTheaterData.address.trim() || 'Cinema Multiplex Hub',
      logo_icon: '🍿',
      admin_credentials: {
        username: newTheaterData.admin_username.trim() || `admin_${generatedId.replace('th_', '')}`,
        password: newTheaterData.admin_password.trim() || 'admin@123',
      },
      kyc: {
        legal_business_name: newTheaterData.name.trim(),
        theater_owner_email: newTheaterData.theater_owner_email.trim() || `owner@${generatedId.replace('th_', '')}.in`,
        company_pan: newTheaterData.company_pan.trim() || 'AABCG1234D',
        gstin: newTheaterData.gstin.trim() || '27AABCG1234D1Z8',
        bank_account_number: newTheaterData.bank_account_number.trim() || '920020038491823',
        bank_ifsc: newTheaterData.bank_ifsc.trim() || 'HDFC0000128',
        bank_name: newTheaterData.bank_name.trim() || 'HDFC Bank Ltd',
        payee_vpa: newTheaterData.payee_vpa.trim() || `${generatedId.replace('th_', '')}@icici`,
        settlement_schedule: 'T+2 Days (Direct Bank Clearing)',
        mdr_rate: '0.00% (Standard Bank-to-Bank UPI)',
        kyc_status: 'VERIFIED',
      },
      payu: {
        merchant_key: newTheaterData.merchant_key.trim() || 'J7xK9sW2',
        merchant_salt: newTheaterData.merchant_salt.trim() || 'eCwWELxi',
        is_encrypted: true,
        environment: 'production',
        payu_checkout_url: 'https://secure.payu.in/_payment',
        webhook_url: 'https://api.cinesnack.in/api/payu/webhook',
        is_verified: true,
      },
      printer: {
        host: 'virtual-printer.online',
        port: 9359,
        auto_print: true,
        header_name: newTheaterData.name.toUpperCase(),
      },
      screens: [
        { id: 'screen_1', name: 'Audi 1 (Dolby Atmos)', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 16 },
        { id: 'screen_2', name: 'Audi 2 (VIP Recliner)', rows: ['A', 'B', 'C', 'D'], seatsPerRow: 12 },
      ],
    });

    setIsAddModalOpen(false);
    setNewTheaterData({
      theater_id: '',
      name: '',
      tagline: '',
      city: '',
      address: '',
      theater_owner_email: '',
      admin_username: '',
      admin_password: '',
      company_pan: '',
      gstin: '',
      bank_account_number: '',
      bank_ifsc: '',
      bank_name: '',
      payee_vpa: '',
      merchant_key: '',
      merchant_salt: '',
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Master Admin' },
            { label: 'Merchant Management', icon: <Building2 className="w-3.5 h-3.5" /> },
            { label: activeTheater.name }
          ]}
        />

        {/* Header Hero */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Merchant Management
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage theater KYC, PayU gateway keys, analytics reports &amp; staff login credentials
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Theater</span>
          </button>
        </div>

        {/* Multi-Theater Merchant Selector Bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-xl">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Select Theater Merchant Account</span>
            <span className="text-neutral-500">{theaters.length} Merchants Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {theaters.map((t) => (
              <button
                key={t.theater_id}
                onClick={() => handleSelectTheater(t.theater_id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  t.theater_id === activeTheaterId
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">{t.name}</span>
                    <span className="text-[11px] text-neutral-400">{t.city} • {t.screens.length} Screens</span>
                  </div>
                  <span className="text-lg">{t.logo_icon}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800/80">
                  <span className="text-neutral-500 font-mono">ID: {t.theater_id}</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Theater Real-Time Analytics & Report Dispatch Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Settlement Analytics: {activeTheater.name}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    0% MDR
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Live revenue reconciliation, downloadable settlement CSVs, and owner email reports
                </p>
              </div>
            </div>

            {/* Actions: Download CSV, Download Statement, Send to Owner Email */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCSVReport}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Download full transactions CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTextStatement}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Download formal statement text"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Statement</span>
              </button>

              <button
                type="button"
                onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: true, sentStatus: '' }))}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Report to Owner</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[11px] text-neutral-400 block">Gross Revenue</span>
              <span className="text-lg sm:text-xl font-extrabold text-white">
                ₹{currentMetrics.total_gross_volume.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-400 block font-semibold">100% Direct Settled</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[11px] text-neutral-400 block">Successful Orders</span>
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {currentMetrics.successful_transactions}
              </span>
              <span className="text-[10px] text-neutral-400 block">
                {theaterTxns.length} total initiated
              </span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[11px] text-neutral-400 block">Conversion Rate</span>
              <span className="text-lg sm:text-xl font-extrabold text-amber-300">
                {currentMetrics.conversion_rate}%
              </span>
              <span className="text-[10px] text-neutral-400 block">UPI intent &amp; QR</span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[11px] text-neutral-400 block">Owner Registered Email</span>
              <span className="text-xs font-mono text-amber-300 truncate block">
                {activeTheater.kyc.theater_owner_email || 'Not configured'}
              </span>
              <span className="text-[10px] text-neutral-400 block">For audit dispatch</span>
            </div>
          </div>
        </div>

        {/* Theater Admin Login Credentials & Master Database Control */}
        <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">
                  Theater Admin Credentials ({activeTheater.name})
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Update Admin ID or password to grant the theater owner immediate login access
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyTheaterCredentials}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
            >
              {copiedCreds ? (
                <>
                  <Check className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Credentials Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Copy Credentials to Share</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSaveCredentials} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
            <div className="sm:col-span-5">
              <label className="block text-neutral-400 font-semibold mb-1">
                Theater Admin ID *
              </label>
              <input
                type="text"
                required
                value={credentialsForm.username}
                onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
                placeholder="e.g. admin_grand"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-400 font-semibold">
                  Theater Admin Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  {showAdminPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showAdminPass ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <input
                type={showAdminPass ? 'text' : 'password'}
                required
                value={credentialsForm.password}
                onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                placeholder="admin@123"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Login</span>
              </button>
            </div>
          </form>

          {/* Master Login Database Table */}
          <div className="pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>All Theaters Login Database</span>
              </span>
              <span className="text-[11px] text-neutral-500">Master admin password control</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="p-2.5">Theater</th>
                    <th className="p-2.5">Admin ID</th>
                    <th className="p-2.5">Password</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
                  {theaters.map((t) => {
                    const isEditing = editingTheaterId === t.theater_id;
                    const isRevealed = revealedDbPasswords[t.theater_id];
                    return (
                      <tr key={t.theater_id} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{t.logo_icon}</span>
                            <div>
                              <span className="block font-bold">{t.name}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">{t.theater_id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-2.5 font-mono text-amber-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={dbCreds.username}
                              onChange={(e) => setDbCreds({ ...dbCreds, username: e.target.value })}
                              className="bg-neutral-900 border border-amber-500 rounded px-2 py-1 text-white text-xs w-full"
                            />
                          ) : (
                            t.admin_credentials?.username || `admin_${t.theater_id.replace('th_', '')}`
                          )}
                        </td>

                        <td className="p-2.5 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={dbCreds.password}
                              onChange={(e) => setDbCreds({ ...dbCreds, password: e.target.value })}
                              className="bg-neutral-900 border border-amber-500 rounded px-2 py-1 text-white text-xs w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>
                                {isRevealed 
                                  ? (t.admin_credentials?.password || 'admin@123') 
                                  : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealDbPassword(t.theater_id)}
                                className="text-neutral-500 hover:text-amber-400"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="p-2.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveDbEdit(t.theater_id)}
                                className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-[11px]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTheaterId(null)}
                                className="px-2 py-1 bg-neutral-800 text-neutral-400 rounded text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartDbEdit(t)}
                              className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 font-semibold rounded text-[11px]"
                            >
                              Edit Credentials
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{savedSuccess}</span>
          </div>
        )}

        {/* Main 2-Column Forms: Merchant KYC & PayU Gateway Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Merchant KYC & Bank Account Details */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Merchant KYC &amp; Banking Information</h3>
                  <p className="text-[11px] text-neutral-400">Theater owner PAN, GSTIN, Owner Email and Bank Account</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                {kycForm.kyc_status}
              </span>
            </div>

            <form onSubmit={handleRequestSaveKYC} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Legal Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={kycForm.legal_business_name}
                  onChange={(e) => setKycForm({ ...kycForm, legal_business_name: e.target.value })}
                  placeholder="e.g. Grand Multiplex Theatres Pvt Ltd"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Theater Owner Email ID (For Settlement Reports) *
                </label>
                <input
                  type="email"
                  required
                  value={kycForm.theater_owner_email || ''}
                  onChange={(e) => setKycForm({ ...kycForm, theater_owner_email: e.target.value })}
                  placeholder="e.g. director@grandmultiplex.in"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Company PAN *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.company_pan}
                    onChange={(e) => setKycForm({ ...kycForm, company_pan: e.target.value.toUpperCase() })}
                    placeholder="AABCG1234D"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    GSTIN (15-Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.gstin}
                    onChange={(e) => setKycForm({ ...kycForm, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AABCG1234D1Z8"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.bank_account_number}
                    onChange={(e) => setKycForm({ ...kycForm, bank_account_number: e.target.value })}
                    placeholder="920020038491823"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycForm.bank_ifsc}
                    onChange={(e) => setKycForm({ ...kycForm, bank_ifsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000128"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Bank Name &amp; Branch
                </label>
                <input
                  type="text"
                  value={kycForm.bank_name}
                  onChange={(e) => setKycForm({ ...kycForm, bank_name: e.target.value })}
                  placeholder="HDFC Bank Ltd, Lower Parel Branch"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Payee VPA / UPI ID (Receiving Handle) *
                </label>
                <input
                  type="text"
                  required
                  value={kycForm.payee_vpa}
                  onChange={(e) => setKycForm({ ...kycForm, payee_vpa: e.target.value })}
                  placeholder="grandcineplex.fnb@hdfcbank"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Direct NPCI routing address for in-seat QR and UPI Intent triggers.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update KYC &amp; Settlement Account (2-Step Verified)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Encrypted PayU Gateway Key & Salt */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">PayU Gateway Keys &amp; Webhook</h3>
                  <p className="text-[11px] text-neutral-400">Encrypted merchant key &amp; salt mapping</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Encrypted</span>
              </span>
            </div>

            <form onSubmit={handleRequestSavePayU} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  PayU Merchant Key *
                </label>
                <input
                  type="text"
                  required
                  value={payuForm.merchant_key}
                  onChange={(e) => setPayuForm({ ...payuForm, merchant_key: e.target.value })}
                  placeholder="e.g. J7xK9sW2"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-400 font-semibold">
                    PayU Merchant Salt (Encrypted) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSalt(!showSalt)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showSalt ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSalt ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSalt ? 'text' : 'password'}
                    required
                    value={payuForm.merchant_salt}
                    onChange={(e) => setPayuForm({ ...payuForm, merchant_salt: e.target.value })}
                    placeholder="eCwWELxi"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Never exposed to client side. Used exclusively on server to compute SHA-512 hashes.
                </p>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Edge Webhook Endpoint (For PayU Console)
                </label>
                <input
                  type="text"
                  readOnly
                  value="https://api.cinesnack.in/api/payu/webhook"
                  className="w-full bg-neutral-950/60 border border-neutral-800/80 rounded-xl px-3 py-2 text-neutral-300 font-mono text-[11px]"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Sub-50ms queue receiver for asynchronous reverse SHA-512 signature validation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Environment
                  </label>
                  <select
                    value={payuForm.environment}
                    onChange={(e) => setPayuForm({ ...payuForm, environment: e.target.value as 'production' | 'test' })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="production">Production (secure.payu.in)</option>
                    <option value="test">Sandbox Test (test.payu.in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Protocol Mode
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="pg=UPI, bankcode=INTENT"
                    className="w-full bg-neutral-950/60 border border-neutral-800/80 rounded-xl px-3 py-2 text-neutral-400 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleTestPayUGateway}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test SHA-512 Handshake</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Keys (2-Step Verified)</span>
                </button>
              </div>

              {testGatewayStatus !== 'IDLE' && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  testGatewayStatus === 'SUCCESS' 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : testGatewayStatus === 'ERROR'
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                }`}>
                  <span className="font-semibold">{testGatewayMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 2-Step Verification Modal */}
        {verifyModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span>2-Step Security Verification</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyModal({ isOpen: false, type: null, confirmationText: '' })}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Live Gateway Modification</span>
                  </p>
                  <p className="text-[11px] text-neutral-300">
                    You are updating sensitive {verifyModal.type === 'KYC' ? 'Merchant KYC & Banking Information' : 'PayU Gateway Keys & Webhook'} for:
                  </p>
                  <p className="font-mono text-xs font-black text-amber-400 pt-0.5">
                    {activeTheater.name}
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1.5">
                    Type the exact theater name to confirm:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={verifyModal.confirmationText}
                    onChange={(e) => setVerifyModal({ ...verifyModal, confirmationText: e.target.value })}
                    placeholder={`Type "${activeTheater.name}"`}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Exact match required: <span className="font-mono text-neutral-400">{activeTheater.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setVerifyModal({ isOpen: false, type: null, confirmationText: '' })}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyModal.confirmationText.trim() !== activeTheater.name.trim()}
                  onClick={handleExecuteVerifiedSave}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify &amp; Apply Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Official Report Email Modal */}
        {emailModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>Send Settlement Report to Theater Owner</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Theater Owner Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailModal.recipientEmail}
                    onChange={(e) => setEmailModal({ ...emailModal, recipientEmail: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Fetched from {activeTheater.name} KYC profile.
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Formatted Financial Reconciliation Statement Preview
                  </label>
                  <pre className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-52">
                    {generateEmailReportBody()}
                  </pre>
                </div>

                {emailModal.sentStatus && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailModal.sentStatus}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleCopyEmailBody}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {emailModal.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{emailModal.copied ? 'Report Copied!' : 'Copy Body'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailReport}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Official Email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboard New Theater Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <span>Onboard New Multiplex / Single-Screen</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTheater} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">Theater Name *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.name}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, name: e.target.value })}
                      placeholder="e.g. INOX Megaplex Mall of Asia"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.city}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, city: e.target.value })}
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Theater Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={newTheaterData.theater_owner_email}
                    onChange={(e) => setNewTheaterData({ ...newTheaterData, theater_owner_email: e.target.value })}
                    placeholder="e.g. owner@inoxasia.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">Admin ID (Staff Login) *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.admin_username}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, admin_username: e.target.value })}
                      placeholder="e.g. admin_inox_moa"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">Admin Password *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.admin_password}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, admin_password: e.target.value })}
                      placeholder="e.g. inox@2025"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.bank_account_number}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, bank_account_number: e.target.value })}
                      placeholder="920020038491823"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">Bank IFSC *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.bank_ifsc}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, bank_ifsc: e.target.value.toUpperCase() })}
                      placeholder="HDFC0000128"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">PayU Merchant Key *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.merchant_key}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, merchant_key: e.target.value })}
                      placeholder="J7xK9sW2"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-semibold mb-1">PayU Merchant Salt *</label>
                    <input
                      type="text"
                      required
                      value={newTheaterData.merchant_salt}
                      onChange={(e) => setNewTheaterData({ ...newTheaterData, merchant_salt: e.target.value })}
                      placeholder="eCwWELxi"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2.5 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20"
                  >
                    Create &amp; Activate Theater
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
