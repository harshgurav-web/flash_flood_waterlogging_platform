import React from 'react';
import {
  X,
  AlertTriangle,
  Smartphone,
  Send,
  Loader2,
  ShieldAlert,
  Info
} from 'lucide-react';

interface SmsAlertConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
  type: 'flash_flood' | 'waterlogging';
  userName: string;
  userPhone: string;
  details: {
    risk: string;
    rainfall?: number;
    soilMoisture?: number;
    waterLevel?: string;
    locationName?: string;
    roadName?: string;
    drainageRisk?: string;
    diagnosis?: string;
  };
}

export const SmsAlertConfirmationModal: React.FC<SmsAlertConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSending,
  type,
  userName,
  userPhone,
  details
}) => {
  if (!isOpen) return null;

  const isFlashFlood = type === 'flash_flood';

  // Preview text matching backend SMS formatting
  const previewText = isFlashFlood
    ? `JALRAKSHAK SIMULATION / DEMO ALERT:
FLASH FLOOD RISK ${(details.risk || 'CRITICAL').toUpperCase()}.
${details.locationName ? `Location: ${details.locationName}\n` : ''}Rainfall: ${details.rainfall !== undefined ? `${details.rainfall} mm/h` : '115 mm/h'}
Soil moisture: ${details.soilMoisture !== undefined ? `${details.soilMoisture}%` : '94%'}
Water level: ${details.waterLevel || 'CRITICAL'}
Risk: ${(details.risk || 'CRITICAL').toUpperCase()}.
Demo only. Follow local official emergency instructions.`
    : `JALRAKSHAK SIMULATION / DEMO ALERT:
${(details.risk || 'SEVERE').toUpperCase()} STREET WATERLOGGING.
${details.roadName ? `Road: ${details.roadName}\n` : ''}Rainfall: ${details.rainfall !== undefined ? `${details.rainfall} mm/h` : '85 mm/h'}
Drainage risk: ${details.drainageRisk || 'RESTRICTED'}
Diagnosis: ${details.diagnosis || 'High runoff overloading roadside drain'}
Demo only. Avoid the affected road and follow local official instructions.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
              isFlashFlood ? 'bg-red-600 shadow-red-500/20' : 'bg-amber-600 shadow-amber-500/20'
            } shadow-md`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-mono">
                Send JalRakshak DEMO SMS alert?
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                Traccar Android SMS Gateway Transmission
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Simulation / Demo Safety Notice */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-black text-amber-900 block tracking-wide font-mono">
                SIMULATION / DEMO — NOT A REAL EMERGENCY ALERT
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                This hackathon simulation transmits a test warning to demonstrate real-time mobile SMS delivery using your local Android gateway.
              </p>
            </div>
          </div>

          {/* User / Phone Recipient Confirmation */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase text-slate-500 font-mono">
              Target Mobile Recipient
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-black text-slate-900 font-mono">
                  {userPhone || 'No phone registered'}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {userName || 'Authenticated User'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Defaulted to your verified account registration number.
            </p>
          </div>

          {/* SMS Body Preview */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase text-slate-500 font-mono flex items-center justify-between">
              <span>SMS Content Preview</span>
              <span className="text-slate-400">Traccar Gateway Payload</span>
            </div>
            <div className="p-3.5 bg-slate-900 text-slate-200 font-mono text-xs rounded-2xl border border-slate-800 whitespace-pre-line leading-relaxed shadow-inner">
              {previewText}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>SMS will be delivered via Android SIM over local network.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending || !userPhone}
            className={`px-5 py-2.5 ${
              isFlashFlood ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            } disabled:bg-slate-400 text-white rounded-xl text-xs font-black font-mono transition flex items-center gap-2 cursor-pointer shadow-md`}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Test Alert</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
