# StoryForge Studio
## AI Story Summarizer, Video Editor, Khmer TTS, Voice Cloning & Subtitle Studio

StoryForge Studio is a professional production-oriented workstation integrating video editing, AI story summarization, multilingual & Khmer speech-to-text (STT), subtitle creation/editing, translation, text-to-speech (TTS), vocal separation, and consent-based voice cloning.

The studio offers both:
1. **Interactive Web Workstation** (Vite + React 19 + Express + Gemini 3.8 SDK + Web Audio + FFmpeg), running live in browser on port 3000.
2. **Windows Desktop Solution** (.NET 8 + C# + WPF + CommunityToolkit.Mvvm + SQLite + FFmpeg), located in `/StoryForgeStudio`.

---

### Features Overview

- **18 Complete Modules**:
  1. **Dashboard**: High-level workflow launcher, active statistics, quick pipeline triggers.
  2. **Projects**: SQLite-backed project management (create, duplicate, save, restore, auto-save).
  3. **Video Editor**: Interactive video player, playhead scrubbing, clip trim/split, audio extraction, format conversion, thumbnail generation, aspect-ratio presets.
  4. **Story Summarizer**: Story extraction pipeline from transcripts or text, generating outlines, scene breakdown, narration scripts, and character listings with selectable tone.
  5. **Transcript Editor**: Timestamped segments, search, speaker labeling, and SRT/TXT/JSON export.
  6. **Subtitle/SRT Editor**: Full subtitle timing editor, millisecond offset shift, overlap detection & auto-fix, reading speed (CPS) validation, burn-in styling with Khmer Unicode fonts (`Noto Sans Khmer`, `Kantumruy Pro`).
  7. **Translation Studio**: Multilingual subtitle & text translation preserving timestamps and Khmer typography.
  8. **Text-to-Speech (TTS) Studio**: Khmer TTS & Multilingual voices (Gemini 3.8 Flash Lite TTS + Browser SpeechSynthesis + Piper local models) with audio playback and timeline send.
  9. **Voice Studio**: Voice catalog, speaker assignment, gender/accent tags.
  10. **Voice Cloning**: Strict consent-verified voice profile creation with acoustic parameter extraction and ethical safeguards.
  11. **Vocal Remover**: Audio stem separation (Vocals vs Instrumental) powered by Demucs / stem synthesis.
  12. **Audio Tools**: Audio trim, split, join, volume normalization, fade in/out, silence detection, sample-rate conversion.
  13. **AI Provider Settings**: Status inspection and setup for FFmpeg, Python, Gemini API, Whisper.cpp, Faster-Whisper, Demucs, and Piper.
  14. **Export Center**: Unified export hub for MP4, WAV, MP3, SRT, Burned Video, Project ZIP, and C# Solution ZIP.
  15. **Processing Queue**: Asynchronous background jobs with live progress, retry, cancel, and logs.
  16. **History & Audit**: Action log and exported artifact history.
  17. **Settings**: Theme (Dark/Light), Khmer font selector, export directory, low-resource mode.
  18. **Logs & Diagnostics**: Live system console and FFmpeg terminal verification.

---

### Prerequisites & Building

#### Web Workstation (Vite + Node.js)
```bash
npm install
npm run build
npm start # or npm run dev
```

#### Windows Desktop (.NET 8 WPF)
Prerequisites:
- Windows 10/11
- .NET 8.0 SDK (or Visual Studio 2022 with .NET desktop development workload)
- FFmpeg installed and in PATH (or configured in Settings)

Build & Test:
```bash
cd StoryForgeStudio
dotnet restore
dotnet build
dotnet test
```

To run the WPF App:
```bash
dotnet run --project src/StoryForgeStudio.App/StoryForgeStudio.App.csproj
```

---

### External Model & API Setup

- **Gemini AI**: Set `GEMINI_API_KEY` in environment variables or `.env`. Supports story summarization, translation, Gemini 3.5 audio transcription, and Gemini 3.8 Flash Lite TTS.
- **FFmpeg**: Required for video trimming, audio extraction, and subtitle burn-in. Auto-detected at `/usr/bin/ffmpeg` or Windows PATH.
- **Demucs**: Run `pip install demucs` in your Python environment for local AI vocal separation.
- **Whisper**: Local CPU transcription adapter supports `whisper.cpp` and `faster-whisper`.
