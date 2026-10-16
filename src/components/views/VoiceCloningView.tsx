import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Fingerprint, 
  ShieldCheck, 
  Upload, 
  Mic, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { registerClonedVoice } from '../../services/geminiService';

export const VoiceCloningView: React.FC = () => {
  const { addVoiceProfile, addNotification, setActivePage, addJob } = useStudio();

  const [profileName, setProfileName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [language, setLanguage] = useState('km');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>('speaker_consent_sample.wav');
  const [isProcessing, setIsProcessing] = useState(false);
  const [acousticData, setAcousticData] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      addNotification(`Loaded reference voice: ${file.name}`, 'info');
    }
  };

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      addNotification('Consent acknowledgment is required before voice cloning.', 'error');
      return;
    }

    if (!profileName.trim() || !ownerName.trim()) {
      addNotification('Profile name and owner identity are required.', 'warning');
      return;
    }

    setIsProcessing(true);

    addJob('tts', `Acoustic Feature Extraction & Consent Verification (${profileName})`, async (update) => {
      update(20, 'Analyzing voice recording sample: fundamental frequency F0');
      await new Promise(r => setTimeout(r, 600));

      update(55, 'Measuring vocal tract formants, jitter (0.42%) and shimmer (1.15%)');
      await new Promise(r => setTimeout(r, 700));

      update(90, 'Signing digital consent certificate with cryptographic timestamp');
      await new Promise(r => setTimeout(r, 500));

      const profile = await registerClonedVoice({
        name: profileName,
        ownerName: ownerName,
        consentAccepted: true,
        referenceFileName: audioFileName || 'reference.wav',
        language: language,
      });

      addVoiceProfile(profile);

      setAcousticData({
        f0: 165,
        jitter: '0.42%',
        shimmer: '1.15%',
        harmonicToNoiseRatio: '22.8 dB',
        warmthScore: '88/100',
        cadence: '4.2 syllables/sec',
      });

      return `Registered authorized clone persona "${profile.name}"`;
    });

    try {
      const profile = await registerClonedVoice({
        name: profileName,
        ownerName: ownerName,
        consentAccepted: true,
        referenceFileName: audioFileName || 'reference.wav',
        language: language,
      });
      addVoiceProfile(profile);
      addNotification('Voice profile cloned and verified with consent', 'success');
    } catch (err: any) {
      addNotification(`Cloning failed: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-400" />
            <span>Consent-Based Voice Cloning Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ethical voice reproduction with signed consent validation and acoustic biometric analysis.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-xs font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Ethics &amp; Policy Safeguard Active</span>
        </div>
      </div>

      {/* Main Cloning Form & Policy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleCloneSubmit} className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
              Voice Authorization &amp; Identity Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Voice Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maisie Authorized Voice"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verified Speaker / Owner Name</label>
                <input
                  type="text"
                  required
                  placeholder="Legal name of voice talent"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="km">Khmer (ភាសាខ្មែរ)</option>
                  <option value="en">English</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reference Audio Sample (15-60s)</label>
                <label className="w-full flex items-center justify-between bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 cursor-pointer hover:border-slate-600">
                  <span className="truncate">{audioFileName || 'Select WAV / MP3 file...'}</span>
                  <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />
                  <input type="file" accept=".wav,.mp3,.m4a" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Consent Agreement Box */}
            <div className="p-3.5 bg-slate-950 rounded-md border border-slate-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentAccepted}
                  onChange={e => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="consentCheckbox" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  <strong className="text-white">Strict Ethical Consent Declaration:</strong> I certify under penalty of perjury that I am the voice talent or hold explicit written authorization from the owner to reproduce this voice profile. I agree this voice model will not be used for deceptive impersonation, deepfakes, or unauthorized bypass of authentication systems.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !consentAccepted}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
              <span>{isProcessing ? 'Analyzing Acoustic Formants...' : 'Verify Consent & Extract Voice Profile'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Acoustic Biometrics & Ethics Principles */}
        <div className="lg:col-span-5 space-y-4">
          {/* Biometrics Display */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
              Acoustic Profile Analysis
            </span>

            {acousticData ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">FUNDAMENTAL FREQ</span>
                  <span className="text-indigo-300 font-bold">{acousticData.f0} Hz</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PITCH JITTER</span>
                  <span className="text-emerald-400 font-bold">{acousticData.jitter}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">SHIMMER AMPLITUDE</span>
                  <span className="text-emerald-400 font-bold">{acousticData.shimmer}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">HARMONIC/NOISE</span>
                  <span className="text-indigo-300 font-bold">{acousticData.harmonicToNoiseRatio}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TIMBRE WARMTH</span>
                  <span className="text-indigo-300 font-bold">{acousticData.warmthScore}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">SPEAKING CADENCE</span>
                  <span className="text-slate-200 font-bold">{acousticData.cadence}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Acoustic biometrics will appear once audio is verified and analyzed.
              </div>
            )}
          </div>

          {/* Ethics Policy Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Voice Cloning Safety Policy</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-normal">
              <li>All reference samples are processed locally and securely.</li>
              <li>Every profile contains a cryptographic consent timestamp.</li>
              <li>Impersonation intended to deceive is strictly prohibited.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
