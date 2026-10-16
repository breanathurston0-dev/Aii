import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Mic2, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Fingerprint, 
  Volume2,
  Users
} from 'lucide-react';
import { VoiceProfile } from '../../types/studio';

export const VoiceStudioView: React.FC = () => {
  const { 
    voiceProfiles, 
    addVoiceProfile, 
    removeVoiceProfile, 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    setActivePage 
  } = useStudio();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('female');
  const [lang, setLang] = useState('km');
  const [voiceId, setVoiceId] = useState('Kore');

  const speakers = Array.from(new Set(activeProject.transcript.map(t => t.speaker))).filter(Boolean);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: VoiceProfile = {
      id: `voice_${Date.now()}`,
      name: name.trim(),
      gender,
      language: lang,
      languageName: lang === 'km' ? 'Khmer (ខ្មែរ)' : 'English',
      provider: 'gemini',
      voiceIdentifier: voiceId,
    };

    addVoiceProfile(newProfile);
    setShowAddModal(false);
    setName('');
  };

  const handleAssignSpeaker = (speaker: string, vId: string) => {
    updateActiveProject(prev => ({
      ...prev,
      voiceMappings: {
        ...prev.voiceMappings,
        [speaker]: vId,
      },
    }));
    addNotification(`Assigned voice to speaker "${speaker}"`, 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-indigo-400" />
            <span>Voice Studio &amp; Speaker Assignment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize multilingual voice personas, assign voices to characters/speakers, and manage acoustic profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('voice-cloning')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md"
          >
            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
            <span>Consent Voice Cloning</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Voice Profile</span>
          </button>
        </div>
      </div>

      {/* Speaker-to-Voice Assignment Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Active Project Speaker Casting ({speakers.length} Detected)
          </span>
        </div>

        {speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {speakers.map(spk => {
              const currentVoiceId = activeProject.voiceMappings[spk] || voiceProfiles[0]?.id;
              return (
                <div key={spk} className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5 text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Speaker: {spk}</span>
                    <span className="text-[10px] font-mono text-indigo-400">Assigned</span>
                  </div>
                  <select
                    value={currentVoiceId}
                    onChange={e => handleAssignSpeaker(spk, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    {voiceProfiles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender}, {v.languageName})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No distinct speakers detected yet. Run transcription in the Transcript Editor to cast voices automatically.
          </p>
        )}
      </div>

      {/* Voice Profiles Catalog */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
          All Voice Profiles ({voiceProfiles.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voiceProfiles.map(v => (
            <div key={v.id} className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{v.name}</span>
                  {v.isCloned ? (
                    <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                      Cloned
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Prebuilt
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>Language: <span className="text-slate-200">{v.languageName}</span></div>
                  <div>Gender: <span className="text-slate-200 capitalize">{v.gender}</span></div>
                  <div>Engine: <span className="text-slate-200">{v.provider} ({v.voiceIdentifier})</span></div>
                  {v.timbreDescription && (
                    <div className="text-[11px] text-indigo-300 font-mono mt-1">{v.timbreDescription}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setActivePage('tts-studio');
                    addNotification(`Selected voice ${v.name} in TTS Studio`, 'info');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Test in TTS →
                </button>

                {v.id !== 'km-voice-1' && (
                  <button
                    onClick={() => removeVoiceProfile(v.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                    title="Delete voice profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Create Voice Profile</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kosal (Auditorium Narrator)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <select
                    value={lang}
                    onChange={e => setLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="km">Khmer (ភាសាខ្មែរ)</option>
                    <option value="en">English</option>
                    <option value="zh">Chinese (中文)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prebuilt Model Voice</label>
                <select
                  value={voiceId}
                  onChange={e => setVoiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="Kore">Kore (Warm, Studio Grade)</option>
                  <option value="Fenrir">Fenrir (Authoritative, Deep)</option>
                  <option value="Puck">Puck (Energetic, Dynamic)</option>
                  <option value="Charon">Charon (Cinematic, Serious)</option>
                  <option value="Zephyr">Zephyr (Bright, Friendly)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
