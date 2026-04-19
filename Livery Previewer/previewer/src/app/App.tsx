import { useEffect, useState } from 'react';
import LiveryViewer from './components/LiveryViewer';
import itzzLogo from '../imports/itzz-logo.png';
import {
  handleAuthCallback,
  validateStoredToken,
  redirectToDiscordLogin,
  extractCodeFromUrl,
  type DiscordUser,
} from '../lib/discordAuth';

type AuthState = 'checking' | 'login' | 'denied' | 'authed';

const DISCLAIMER_TEXT = `LIVERY PREVIEWER — DISCLAIMER & LEGAL NOTICE

This tool is an independent, fan-made project created for the itzz community. It is not affiliated with, endorsed by, or connected to Police Roleplay Community (PRC), the developers of Emergency Response: Liberty County (ERLC), Roblox, or any third-party platform.

SOURCE OF ASSETS

The 3D vehicle models displayed within this tool are originally created by and belong to Police Roleplay Community (PRC), the developers of Emergency Response: Liberty County. We do not claim ownership of these models in any way. Full credit for their creation belongs entirely to the PRC development team.

These models were obtained from samkalish.dev, a third-party website on which they were publicly accessible. We did not extract these models directly from ERLC or the Roblox platform. All intellectual property rights remain with their respective owners.

USE & INTENT

This tool exists purely for the personal, non-commercial enjoyment of the itzz community. No assets are sold, redistributed as standalone files, or used for any commercial gain whatsoever. The tool is provided completely free of charge and is intended solely as a livery design aid for community members.

NO WARRANTY

This tool is provided "as is" without any guarantees of availability, accuracy, or fitness for any particular purpose. We reserve the right to modify or discontinue the service at any time without notice.

IF YOU'RE FROM THE PRC TEAM

Please reach out to us if you have any issue with this tool.

By logging in with Discord, you acknowledge that you have read this disclaimer and understand the nature of this tool and its assets.`;

function downloadDisclaimer() {
  const blob = new Blob([DISCLAIMER_TEXT], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'LiveryPreviewer-Disclaimer.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DisclaimerModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Legal Disclaimer</p>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-[10.5px] text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
            {DISCLAIMER_TEXT}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-2 shrink-0">
          <button
            onClick={downloadDisclaimer}
            className="flex-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl transition-all"
          >
            ↓ Download TXT
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#c4ff0d]/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const Credits = () => (
  <p className="fixed bottom-4 left-4 text-[10px] text-zinc-600 tracking-wider pointer-events-none">
    developed by itzz industries | sonar & itzz_link
  </p>
);

export default function App() {
  const [authState, setAuthState]       = useState<AuthState>('checking');
  const [authError, setAuthError]       = useState<string | null>(null);
  const [user, setUser]                 = useState<DiscordUser | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    async function init() {
      if (extractCodeFromUrl()) {
        try {
          const u = await handleAuthCallback();
          setUser(u);
          setAuthState('authed');
        } catch (e: any) {
          setAuthError(e.message ?? 'Authentication failed.');
          setAuthState('denied');
        }
        return;
      }

      // Re-validate stored token silently — user won't need to log in again
      const u = await validateStoredToken();
      if (u) {
        setUser(u);
        setAuthState('authed');
      } else {
        setAuthState('login');
      }
    }
    init();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setAuthState('login');
  };

  if (authState === 'checking') {
    return (
      <div className="flex h-screen bg-[#0d0d0d] items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <Credits />
      </div>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="flex h-screen bg-[#0d0d0d] items-center justify-center text-white">
        <div className="text-center max-w-sm space-y-4 px-6">
          <p className="text-2xl">🚫</p>
          <p className="text-sm text-zinc-300">{authError ?? 'Access denied.'}</p>
          <button
            onClick={() => setAuthState('login')}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors"
          >
            Try again
          </button>
        </div>
        <Credits />
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="flex h-screen bg-[#0d0d0d] items-center justify-center text-white">
        {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}

        <div className="text-center space-y-6 px-6">
          <div className="space-y-3">
            <img src={itzzLogo} alt="itzz" className="h-16 w-auto mx-auto drop-shadow-[0_0_12px_rgba(196,255,13,0.4)]" />
            <p className="text-2xl font-bold tracking-[0.2em] uppercase text-white">Livery Previewer</p>
            <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase">ITZZ MEMBERS ONLY</p>
          </div>
          <button
            onClick={() => redirectToDiscordLogin()}
            className="flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors mx-auto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Login with Discord
          </button>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors mx-auto block"
          >
            Legal Disclaimer
          </button>
        </div>
        <Credits />
      </div>
    );
  }

  return (
    <>
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
      <LiveryViewer user={user} onLogout={handleLogout} onShowDisclaimer={() => setShowDisclaimer(true)} />
      <Credits />
    </>
  );
}
