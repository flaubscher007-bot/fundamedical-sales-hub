import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileDown, Mail, MessageCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LeadExportOptions({ lead, open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error', null
  const [message, setMessage] = useState('');

  const handleDownloadPDF = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await base44.functions.invoke('generateLeadPDF', {
        leadId: lead.id,
        action: 'download',
      });

      // Create blob and download
      const htmlContent = response.data;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead_${lead.name.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
      setMessage('PDF downloaded successfully');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPDF = async () => {
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await base44.functions.invoke('generateLeadPDF', {
        leadId: lead.id,
        action: 'email',
        email: email.trim(),
      });

      setStatus('success');
      setMessage(`PDF sent to ${email}`);
      setEmail('');
      setTimeout(() => {
        setStatus(null);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await base44.functions.invoke('generateLeadPDF', {
        leadId: lead.id,
        action: 'whatsapp',
      });

      const whatsappMessage = response.data.message;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const phoneNumber = lead.phone?.replace(/\D/g, '');

      if (phoneNumber) {
        // Open WhatsApp with pre-filled message
        window.open(
          `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
          '_blank'
        );
        setStatus('success');
        setMessage('Opening WhatsApp...');
        setTimeout(() => setStatus(null), 2000);
      } else {
        setStatus('error');
        setMessage('Phone number not available for this lead');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to prepare WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD040' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#92F21D' }}>Export Lead: {lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Download PDF */}
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(146,242,29,0.08)', borderColor: 'rgba(146,242,29,0.2)' }}>
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#92F21D' }}>
              <FileDown className="w-4 h-4" />
              Download as PDF
            </h4>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              Download the lead details as an HTML file that can be printed to PDF
            </p>
            <Button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: '#92F21D', color: '#081F3F', fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>

          {/* Email PDF */}
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(52,204,208,0.08)', borderColor: 'rgba(52,204,208,0.2)' }}>
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#34CCD0' }}>
              <Mail className="w-4 h-4" />
              Email as PDF
            </h4>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              Send the lead details directly to an email address
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleEmailPDF}
                disabled={loading || !email.trim()}
                style={{ backgroundColor: '#34CCD0', color: '#081F3F', fontWeight: 600 }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#10b981' }}>
              <MessageCircle className="w-4 h-4" />
              Share via WhatsApp
            </h4>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              Send lead details via WhatsApp {lead.phone && `to ${lead.phone}`}
            </p>
            <Button
              onClick={handleWhatsApp}
              disabled={loading || !lead.phone}
              className="w-full"
              style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send via WhatsApp
                </>
              )}
            </Button>
            {!lead.phone && (
              <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
                ⚠️ Phone number not available for this lead
              </p>
            )}
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(16,185,129,0.15)', borderLeft: '3px solid #10b981' }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: '#10b981' }}>{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderLeft: '3px solid #ef4444' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#ef4444' }}>{message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}