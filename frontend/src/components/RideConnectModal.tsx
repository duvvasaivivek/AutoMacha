import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Phone,
  Mail,
  Copy,
  Check,
  Send,
  GraduationCap,
  Home,
  Sparkles,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestRideShare } from '@/services/travelRequest.service';
import type { TravelRequestUser } from '@/types';

interface RideConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: TravelRequestUser;
  destinationName: string;
  travelDate: string;
  requestId: number;
}

export const RideConnectModal: React.FC<RideConnectModalProps> = ({
  isOpen,
  onClose,
  partner,
  destinationName,
  travelDate,
  requestId,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const prefilledMessage = `Hi @${partner.username}! I saw your ride match on AutoMacha for ${destinationName} on ${travelDate}. Shall we share the cab/ride?`;

  const cleanPhone = partner.phone_number ? partner.phone_number.replace(/[^0-9]/g, '') : '';
  const formattedWaPhone = cleanPhone ? (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`) : '';
  const whatsappUrl = formattedWaPhone
    ? `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(prefilledMessage)}`
    : null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(prefilledMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInAppRequest = async () => {
    setIsSending(true);
    setErrorMsg(null);
    try {
      await requestRideShare(requestId);
      setRequestSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to send ride share request. Please try again or use WhatsApp/Email.';
      setErrorMsg(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black font-black text-xl flex items-center justify-center shadow-lg uppercase border-2 border-white/20 shrink-0">
              {partner.username.slice(0, 2)}
            </div>
            <div className="space-y-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
                  <span>Ride Partner</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-white truncate">@{partner.username}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 font-medium">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{partner.branch || 'Student Course'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{partner.hostel || 'Campus Residence'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Connect Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">
              1. Instant Direct Chat & Call
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-1 sm:col-span-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group"
                >
                  <MessageCircle className="h-5 w-5 fill-current animate-bounce" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <div className="col-span-1 sm:col-span-2 bg-neutral-100 border border-neutral-200 text-neutral-600 p-3 rounded-2xl text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4 text-neutral-400" />
                  <span>Student hasn&apos;t linked a WhatsApp phone number yet.</span>
                </div>
              )}

              {partner.phone_number ? (
                <a
                  href={`tel:${partner.phone_number}`}
                  className="bg-neutral-900 hover:bg-black text-white p-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span>Call ({partner.phone_number})</span>
                </a>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 text-neutral-400 p-3 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>No Phone Listed</span>
                </div>
              )}

              {partner.institute_email ? (
                <a
                  href={`mailto:${partner.institute_email}?subject=${encodeURIComponent(`AutoMacha Ride Share - ${destinationName}`)}`}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-neutral-200/80"
                >
                  <Mail className="h-4 w-4 text-neutral-700" />
                  <span className="truncate max-w-[150px]">{partner.institute_email}</span>
                </a>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 text-neutral-400 p-3 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>No Email Listed</span>
                </div>
              )}
            </div>
          </div>

          {/* Message Template */}
          <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Coordination Message Template</span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-600 italic bg-white p-3 rounded-xl border border-neutral-200 select-all font-medium leading-relaxed">
              &quot;{prefilledMessage}&quot;
            </p>
          </div>

          {/* In-App Ride Request Section */}
          <div className="pt-2 border-t border-neutral-200 space-y-3">
            <h4 className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">
              2. In-App Notification Invite
            </h4>

            {requestSent ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Ride Share Request Sent!</p>
                  <p className="text-xs text-emerald-700 leading-normal">
                    We have sent an in-app notification invite to <strong>@{partner.username}</strong>. When they accept, you will receive a confirmation in your Notification Center!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleSendInAppRequest}
                  disabled={isSending}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-5 rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Invite to @{partner.username}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 text-emerald-400" />
                      <span>Send In-App Ride Share Invite</span>
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-neutral-400 text-center font-medium">
                  Sends an official notification right inside AutoMacha so they can accept or decline.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-bold text-xs px-5 border-neutral-300 hover:bg-neutral-200/60"
          >
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
};
