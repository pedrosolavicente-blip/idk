import { useEffect, useState } from 'react';
import LiveryViewer from './components/LiveryViewer';
import LoginPage from './components/LoginPage';
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Legal Disclaimer</p>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-[10.5px] text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
            {DISCLAIMER_TEXT}
          </pre>
        </div>
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

export default function App() {
  const [authState, setAuthState]           = useState<AuthState>('checking');
  const [authError, setAuthError]           = useState<string | null>(null);
  const [user, setUser]                     = useState<DiscordUser | null>(null);
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
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <>
        {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
        <LoginPage
          onLogin={redirectToDiscordLogin}
          onDisclaimer={() => setShowDisclaimer(true)}
        />
      </>
    );
  }

  return (
    <>
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
      <LiveryViewer user={user} onLogout={handleLogout} onShowDisclaimer={() => setShowDisclaimer(true)} />
    </>
  );
}
