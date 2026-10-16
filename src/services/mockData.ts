import { Project } from '../types/studio';
import { generateSampleComments } from './commentsService';

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'proj_khmer_angkor_01',
    name: 'Angkor Heritage & Folk Tales',
    description: 'Documentary narrative exploring the legendary stone carvings of Angkor Wat and ancient Khmer folklore.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    sourceLanguage: 'km',
    targetLanguage: 'en',
    durationSeconds: 145.0,
    mediaFiles: [
      {
        id: 'media_sample_01',
        name: 'Angkor_Temple_Sunrise_4K.mp4',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 145.0,
        width: 1920,
        height: 1080,
        frameRate: 30.0,
        videoCodec: 'h264',
        audioCodec: 'aac',
        sizeBytes: 15485760,
        thumbnailUrl: '',
      },
    ],
    transcript: [
      {
        id: 1,
        startTime: 0.0,
        endTime: 4.8,
        speaker: 'Narrator',
        text: 'សូមស្វាគមន៍មកកាន់ប្រាសាទអង្គរវត្ត ដែលជាបេតិកភណ្ឌពិភពលោកដ៏អស្ចារ្យ។',
        confidence: 0.98,
      },
      {
        id: 2,
        startTime: 5.2,
        endTime: 10.5,
        speaker: 'Narrator',
        text: 'ប្រាសាទនេះត្រូវបានកសាងឡើងនៅដើមសតវត្សរ៍ទី១២ ដោយព្រះបាទសូរ្យវរ្ម័នទី២។',
        confidence: 0.96,
      },
      {
        id: 3,
        startTime: 11.0,
        endTime: 17.2,
        speaker: 'Historian',
        text: 'ក្បាច់ចម្លាក់អប្សរាជាងបីពាន់រូបនៅលើជញ្ជាំងថ្មឆ្លុះបញ្ចាំងពីសិល្បៈនិងជំនឿបុរាណដ៏រុងរឿង។',
        confidence: 0.94,
      },
      {
        id: 4,
        startTime: 18.0,
        endTime: 24.5,
        speaker: 'Narrator',
        text: 'រឿងនិទាននិងប្រវត្តិសាស្ត្រខ្មែរនៅតែបន្តរស់រវើកនៅក្នុងដួងចិត្តប្រជាជនកម្ពុជាគ្រប់ជំនាន់។',
        confidence: 0.97,
      },
    ],
    subtitles: [
      {
        id: 1,
        startTime: '00:00:00,500',
        endTime: '00:00:04,800',
        startSeconds: 0.5,
        endSeconds: 4.8,
        speaker: 'Narrator',
        text: 'សូមស្វាគមន៍មកកាន់ប្រាសាទអង្គរវត្ត ដែលជាបេតិកភណ្ឌពិភពលោកដ៏អស្ចារ្យ។',
        isOverlapping: false,
        cpsAlert: false,
      },
      {
        id: 2,
        startTime: '00:00:05,200',
        endTime: '00:00:10,500',
        startSeconds: 5.2,
        endSeconds: 10.5,
        speaker: 'Narrator',
        text: 'ប្រាសាទនេះត្រូវបានកសាងឡើងនៅដើមសតវត្សរ៍ទី១២ ដោយព្រះបាទសូរ្យវរ្ម័នទី២។',
        isOverlapping: false,
        cpsAlert: false,
      },
      {
        id: 3,
        startTime: '00:00:11,000',
        endTime: '00:00:17,200',
        startSeconds: 11.0,
        endSeconds: 17.2,
        speaker: 'Historian',
        text: 'ក្បាច់ចម្លាក់អប្សរាជាងបីពាន់រូបនៅលើជញ្ជាំងថ្មឆ្លុះបញ្ចាំងពីសិល្បៈនិងជំនឿបុរាណដ៏រុងរឿង។',
        isOverlapping: false,
        cpsAlert: false,
      },
      {
        id: 4,
        startTime: '00:00:18,000',
        endTime: '00:00:24,500',
        startSeconds: 18.0,
        endSeconds: 24.5,
        speaker: 'Narrator',
        text: 'រឿងនិទាននិងប្រវត្តិសាស្ត្រខ្មែរនៅតែបន្តរស់រវើកនៅក្នុងដួងចិត្តប្រជាជនកម្ពុជាគ្រប់ជំនាន់។',
        isOverlapping: false,
        cpsAlert: false,
      },
    ],
    storySummary: {
      title: 'Echoes of Angkor: Stone and Spirit',
      synopsis: 'A lyrical documentary exploring Angkor Wat’s 12th-century architecture, thousands of unique Apsara carvings, and the living folk traditions passed down through generations.',
      keyEvents: [
        'Sunrise over the main five towers of Angkor Wat',
        'Detailed exploration of the bas-relief galleries depicting ancient epics',
        'Community interviews reflecting on cultural preservation and oral history',
      ],
      sceneOutline: [
        { sceneNumber: 1, title: 'Dawn over Angkor', description: 'Silhouetted towers reflecting in the lotus pond', durationSeconds: 30 },
        { sceneNumber: 2, title: 'The Architects of Stone', description: 'Tracing the engineering prowess of King Suryavarman II', durationSeconds: 50 },
        { sceneNumber: 3, title: 'Living Whispers', description: 'Elders passing down folk tales to youth in Siem Reap', durationSeconds: 65 },
      ],
      narrationScript: 'In the heart of Southeast Asia stands a monument not only of stone, but of human aspiration. Built in the early twelfth century by King Suryavarman II, Angkor Wat remains the architectural summit of Khmer ingenuity.',
      characters: [
        { name: 'Narrator', role: 'Main Storyteller', suggestedVoiceTone: 'Warm, resonant, contemplative' },
        { name: 'Historian', role: 'Context Expert', suggestedVoiceTone: 'Scholarly, precise, passionate' },
      ],
      socialHook: 'Discover the hidden secrets etched inside Angkor Wat’s 3,000 stone carvings.',
      tone: 'Documentary',
      length: 'medium',
      createdAt: new Date().toISOString(),
    },
    voiceMappings: {
      Narrator: 'km-voice-1',
      Historian: 'km-voice-2',
    },
    burnInConfig: {
      fontFamily: 'Noto Sans Khmer',
      fontSize: 28,
      fontColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowOffset: 2,
      backgroundColor: 'transparent',
      alignment: 'bottom',
      marginVertical: 40,
      resolution: '1080p',
    },
    folderId: 'folder_client_angkor',
    clientName: 'Angkor Heritage Foundation',
    projectType: 'Documentary',
    status: 'in-progress',
    tags: ['Cultural', 'Khmer', 'Documentary', 'Heritage'],
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    milestones: [
      {
        id: 'ms_angkor_1',
        title: 'Story Outline & Scene Breakdown',
        dueDate: new Date(Date.now() - 86400000 * 4).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stage: 'script',
        notes: 'Extracted 4 scenes and 3 mythological character profiles from temple manuscripts.'
      },
      {
        id: 'ms_angkor_2',
        title: 'Khmer Whisper STT Audio Transcription',
        dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        stage: 'transcription',
        notes: 'Processed 145s narration audio track with Faster-Whisper Khmer model.'
      },
      {
        id: 'ms_angkor_3',
        title: 'Bilingual Subtitle Alignment & CPS Verification',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        stage: 'subtitles',
        notes: 'Validated Khmer Unicode line wrapping and 14 CPS readability thresholds.'
      },
      {
        id: 'ms_angkor_4',
        title: 'Gemini 3.8 Khmer Audio Voiceover Dub',
        dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        completed: false,
        stage: 'voiceover',
        notes: 'Casting deep documentary voice timbre with studio room reverb.'
      },
      {
        id: 'ms_angkor_5',
        title: 'Final 4K Master MP4 Delivery',
        dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        completed: false,
        stage: 'export',
        notes: 'Full-resolution H.264 burn-in render with stereo stem mix.'
      }
    ],
    comments: generateSampleComments('proj_khmer_angkor_01'),
  },
  {
    id: 'proj_ai_tech_showcase',
    name: 'Next-Gen Multilingual Storytelling',
    description: 'Tech overview highlighting automatic voice cloning ethics, subtitle synchronization, and speech synthesis.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    sourceLanguage: 'en',
    targetLanguage: 'km',
    durationSeconds: 98.0,
    mediaFiles: [
      {
        id: 'media_sample_02',
        name: 'AI_Studio_Workflow.mp4',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        duration: 98.0,
        width: 1920,
        height: 1080,
        frameRate: 24.0,
        videoCodec: 'h264',
        audioCodec: 'aac',
        sizeBytes: 11200340,
      },
    ],
    transcript: [
      {
        id: 1,
        startTime: 0.0,
        endTime: 4.5,
        speaker: 'Alex',
        text: 'Welcome to StoryForge Studio, where automated video editing meets cutting-edge speech synthesis.',
      },
      {
        id: 2,
        startTime: 5.0,
        endTime: 9.8,
        speaker: 'Sam',
        text: 'With support for Khmer Unicode and real-time subtitle burn-in, creators can localize their content seamlessly.',
      },
    ],
    subtitles: [
      {
        id: 1,
        startTime: '00:00:00,000',
        endTime: '00:00:04,500',
        startSeconds: 0.0,
        endSeconds: 4.5,
        speaker: 'Alex',
        text: 'Welcome to StoryForge Studio, where automated video editing meets cutting-edge speech synthesis.',
      },
      {
        id: 2,
        startTime: '00:00:05,000',
        endTime: '00:00:09,800',
        startSeconds: 5.0,
        endSeconds: 9.8,
        speaker: 'Sam',
        text: 'With support for Khmer Unicode and real-time subtitle burn-in, creators can localize their content seamlessly.',
      },
    ],
    voiceMappings: {
      Alex: 'en-voice-2',
      Sam: 'en-voice-1',
    },
    burnInConfig: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 26,
      fontColor: '#F8FAFC',
      outlineColor: '#090D16',
      outlineWidth: 2,
      shadowOffset: 2,
      backgroundColor: 'transparent',
      alignment: 'bottom',
      marginVertical: 32,
      resolution: '1080p',
    },
    folderId: 'folder_type_dubbing',
    clientName: 'StoryForge Labs',
    projectType: 'Dubbing',
    status: 'completed',
    tags: ['AI', 'Speech', 'Localization', 'Voiceover'],
    startDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    deadline: new Date(Date.now() - 86400000 * 1).toISOString(),
    milestones: [
      {
        id: 'ms_tech_1',
        title: 'Story Concept & Dual-Host Dialogue Script',
        dueDate: new Date(Date.now() - 86400000 * 6).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        stage: 'script'
      },
      {
        id: 'ms_tech_2',
        title: 'Dual-Speaker Natural Speech Synthesis',
        dueDate: new Date(Date.now() - 86400000 * 4).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stage: 'voiceover'
      },
      {
        id: 'ms_tech_3',
        title: 'Khmer Subtitle Alignment & Font Burn-In Test',
        dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        stage: 'subtitles'
      },
      {
        id: 'ms_tech_4',
        title: 'Final Delivery & Archive',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        stage: 'export'
      }
    ]
  },
  {
    id: 'proj_social_siemreap_01',
    name: 'Siem Reap Night Market Viral Reel',
    description: 'High-energy 9:16 vertical food tour through the buzzing alleyways of Siem Reap night markets with Khmer karaoke captions.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    sourceLanguage: 'km',
    targetLanguage: 'en',
    durationSeconds: 48.0,
    mediaFiles: [
      {
        id: 'media_sample_03',
        name: 'Siem_Reap_Night_Market_916.mp4',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 48.0,
        width: 1080,
        height: 1920,
        frameRate: 30.0,
        videoCodec: 'h264',
        audioCodec: 'aac',
        sizeBytes: 8500000,
      },
    ],
    transcript: [
      { id: 1, startTime: 0.0, endTime: 3.5, speaker: 'Host', text: 'តោះទៅភ្លក្សម្ហូបតាមផ្លូវដ៏ឆ្ងាញ់នៅក្រុងសៀមរាប!' },
      { id: 2, startTime: 4.0, endTime: 8.5, speaker: 'Host', text: 'ក្លិនឈ្ងុយនៃសាច់គោអាំងនិងនំប៉័ងប៉ាតេពិតជាទាក់ទាញខ្លាំងណាស់។' },
    ],
    subtitles: [
      { id: 1, startTime: '00:00:00,000', endTime: '00:00:03,500', startSeconds: 0, endSeconds: 3.5, speaker: 'Host', text: 'តោះទៅភ្លក្សម្ហូបតាមផ្លូវដ៏ឆ្ងាញ់នៅក្រុងសៀមរាប!' },
      { id: 2, startTime: '00:00:04,000', endTime: '00:00:08,500', startSeconds: 4, endSeconds: 8.5, speaker: 'Host', text: 'ក្លិនឈ្ងុយនៃសាច់គោអាំងនិងនំប៉័ងប៉ាតេពិតជាទាក់ទាញខ្លាំងណាស់។' },
    ],
    voiceMappings: { Host: 'km-voice-1' },
    burnInConfig: {
      fontFamily: 'Kantumruy Pro',
      fontSize: 34,
      fontColor: '#FACC15',
      outlineColor: '#000000',
      outlineWidth: 4,
      shadowOffset: 3,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignment: 'middle',
      marginVertical: 120,
      resolution: 'vertical_1080x1920',
    },
    folderId: 'folder_type_social',
    clientName: 'Acme Media Group',
    projectType: 'Social Video',
    status: 'in-progress',
    tags: ['9:16', 'TikTok', 'Food Tour', 'Siem Reap'],
    startDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    milestones: [
      {
        id: 'ms_social_1',
        title: 'Hook Editing & Scene Cuts (9:16 Format)',
        dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        stage: 'script'
      },
      {
        id: 'ms_social_2',
        title: 'Karaoke-Style Khmer Dynamic Captions',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        stage: 'subtitles'
      },
      {
        id: 'ms_social_3',
        title: 'Sound Effect Drops & Vocal Normalization',
        dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        completed: false,
        stage: 'voiceover'
      },
      {
        id: 'ms_social_4',
        title: 'TikTok & Reels 1080x1920 Export',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        completed: false,
        stage: 'export'
      }
    ]
  },
  {
    id: 'proj_audiobook_reamker_01',
    name: 'The Golden Reamker — Episode 1: The Forest Exile',
    description: 'Immersive spoken-word audiobook master narration featuring atmospheric soundscapes and dual character casting.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    sourceLanguage: 'km',
    targetLanguage: 'km',
    durationSeconds: 180.0,
    mediaFiles: [
      {
        id: 'media_sample_04',
        name: 'Reamker_Episode_1_Master.mp3',
        type: 'audio',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 180.0,
        sizeBytes: 18400000,
      },
    ],
    transcript: [
      { id: 1, startTime: 0.0, endTime: 6.0, speaker: 'Narrator', text: 'ជំពូកទីមួយ៖ ដំណើរនិរទេសចូលទៅក្នុងព្រៃហេមពាន្តនៃព្រះរាមនិងនាងសីតា។' },
    ],
    subtitles: [
      { id: 1, startTime: '00:00:00,000', endTime: '00:00:06,000', startSeconds: 0, endSeconds: 6.0, speaker: 'Narrator', text: 'ជំពូកទីមួយ៖ ដំណើរនិរទេសចូលទៅក្នុងព្រៃហេមពាន្តនៃព្រះរាមនិងនាងសីតា។' },
    ],
    voiceMappings: { Narrator: 'km-voice-2' },
    burnInConfig: {
      fontFamily: 'Noto Sans Khmer',
      fontSize: 24,
      fontColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      shadowOffset: 2,
      backgroundColor: 'transparent',
      alignment: 'bottom',
      marginVertical: 30,
      resolution: '1080p',
    },
    folderId: 'folder_type_audiobook',
    clientName: 'Angkor Heritage Foundation',
    projectType: 'Audiobook',
    status: 'in-progress',
    tags: ['Epic', 'Audiobook', 'Literature', 'Reamker'],
    startDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 8).toISOString(),
    milestones: [
      {
        id: 'ms_reamker_1',
        title: 'Literary Adaptation & Chapter Scripting',
        dueDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        stage: 'script'
      },
      {
        id: 'ms_reamker_2',
        title: 'Demucs Ambient Stem Isolation',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        stage: 'transcription'
      },
      {
        id: 'ms_reamker_3',
        title: 'Master Khmer Storyteller TTS Synthesis',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        completed: false,
        stage: 'voiceover'
      },
      {
        id: 'ms_reamker_4',
        title: 'Audiobook QA & Chapter Mastering',
        dueDate: new Date(Date.now() + 86400000 * 6).toISOString(),
        completed: false,
        stage: 'review'
      },
      {
        id: 'ms_reamker_5',
        title: 'M4B & Lossless WAV Distribution Package',
        dueDate: new Date(Date.now() + 86400000 * 8).toISOString(),
        completed: false,
        stage: 'export'
      }
    ]
  },
  {
    id: 'proj_corporate_summit_01',
    name: 'ASEAN Digital Innovation Summit Promo',
    description: 'Bilingual keynote promotional video produced for regional business delegates and government partners.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
    sourceLanguage: 'en',
    targetLanguage: 'km',
    durationSeconds: 75.0,
    mediaFiles: [
      {
        id: 'media_sample_05',
        name: 'ASEAN_Summit_Promo.mp4',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: 75.0,
        width: 1920,
        height: 1080,
        frameRate: 30.0,
        videoCodec: 'h264',
        audioCodec: 'aac',
        sizeBytes: 9400000,
      },
    ],
    transcript: [
      { id: 1, startTime: 0.0, endTime: 5.0, speaker: 'Executive', text: 'Welcome leaders from across Southeast Asia to Phnom Penh for the 2026 Summit.' },
    ],
    subtitles: [
      { id: 1, startTime: '00:00:00,000', endTime: '00:00:05,000', startSeconds: 0, endSeconds: 5.0, speaker: 'Executive', text: 'សូមស្វាគមន៍ថ្នាក់ដឹកនាំមកពីទូទាំងអាស៊ីអាគ្នេយ៍មកកាន់រាជធានីភ្នំពេញសម្រាប់កិច្ចប្រជុំកំពូលឆ្នាំ ២០២៦។' },
    ],
    voiceMappings: { Executive: 'en-voice-3' },
    burnInConfig: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 26,
      fontColor: '#FFFFFF',
      outlineColor: '#090D16',
      outlineWidth: 2,
      shadowOffset: 2,
      backgroundColor: 'transparent',
      alignment: 'bottom',
      marginVertical: 35,
      resolution: '1080p',
    },
    folderId: 'folder_client_acme',
    clientName: 'Acme Media Group',
    projectType: 'Commercial',
    status: 'review',
    tags: ['Commercial', 'Corporate', 'Bilingual', 'Summit'],
    startDate: new Date(Date.now() - 86400000 * 6).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    milestones: [
      {
        id: 'ms_summit_1',
        title: 'Executive Keynote Translation (EN → KM)',
        dueDate: new Date(Date.now() - 86400000 * 4).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stage: 'translation'
      },
      {
        id: 'ms_summit_2',
        title: 'Speaker Voice Profile Cloned Audio Generation',
        dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        stage: 'voiceover'
      },
      {
        id: 'ms_summit_3',
        title: 'Bilingual Review with ASEAN Committee',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        completed: false,
        stage: 'review'
      },
      {
        id: 'ms_summit_4',
        title: 'Full 1080p Keynote Burn-In Delivery',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        completed: false,
        stage: 'export'
      }
    ]
  },
  {
    id: 'proj_pppost_brief_01',
    name: 'Mekong River Ecological Brief',
    description: 'Weekly investigative video report covering seasonal fisheries, biodiversity data, and river community resilience.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    sourceLanguage: 'km',
    targetLanguage: 'en',
    durationSeconds: 110.0,
    mediaFiles: [
      {
        id: 'media_sample_06',
        name: 'Mekong_River_Brief.mp4',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
        duration: 110.0,
        width: 1920,
        height: 1080,
        frameRate: 30.0,
        videoCodec: 'h264',
        audioCodec: 'aac',
        sizeBytes: 13800000,
      },
    ],
    transcript: [
      { id: 1, startTime: 0.0, endTime: 4.8, speaker: 'Journalist', text: 'របាយការណ៍សប្តាហ៍នេះស្តីពីស្ថានភាពទឹកទន្លេមេគង្គនិងផលប៉ះពាល់លើជីវភាពប្រជានេសាទ។' },
    ],
    subtitles: [
      { id: 1, startTime: '00:00:00,000', endTime: '00:00:04,800', startSeconds: 0, endSeconds: 4.8, speaker: 'Journalist', text: 'របាយការណ៍សប្តាហ៍នេះស្តីពីស្ថានភាពទឹកទន្លេមេគង្គនិងផលប៉ះពាល់លើជីវភាពប្រជានេសាទ។' },
    ],
    voiceMappings: { Journalist: 'km-voice-1' },
    burnInConfig: {
      fontFamily: 'Noto Sans Khmer',
      fontSize: 26,
      fontColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 3,
      shadowOffset: 2,
      backgroundColor: 'transparent',
      alignment: 'bottom',
      marginVertical: 35,
      resolution: '1080p',
    },
    folderId: 'folder_client_pppost',
    clientName: 'Phnom Penh Post Video',
    projectType: 'Podcast',
    status: 'in-progress',
    tags: ['News', 'Mekong', 'Journalism', 'Environment'],
    startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    milestones: [
      {
        id: 'ms_mekong_1',
        title: 'Field Audio STT Transcription & Verification',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        stage: 'transcription'
      },
      {
        id: 'ms_mekong_2',
        title: 'Khmer Headline Subtitle Timing & Styling',
        dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        completed: false,
        stage: 'subtitles'
      },
      {
        id: 'ms_mekong_3',
        title: 'Journalist English Narration Dubbing',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        completed: false,
        stage: 'voiceover'
      },
      {
        id: 'ms_mekong_4',
        title: 'Broadcast Web Video Packaging',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        completed: false,
        stage: 'export'
      }
    ]
  },
];

export const DEFAULT_PROJECT_FOLDERS: import('../types/studio').ProjectFolder[] = [
  {
    id: 'folder_client_acme',
    name: 'Acme Media Group',
    categoryType: 'client',
    clientName: 'Acme Media Group',
    color: '#6366f1', // Indigo
    description: 'Commercial campaigns, localized promos, and short-form brand deliverables',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'folder_client_angkor',
    name: 'Angkor Heritage Foundation',
    categoryType: 'client',
    clientName: 'Angkor Heritage Foundation',
    color: '#10b981', // Emerald
    description: 'Khmer cultural preservation, temple documentaries, and archaeological archives',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'folder_client_pppost',
    name: 'Phnom Penh Post Video',
    categoryType: 'client',
    clientName: 'Phnom Penh Post',
    color: '#f59e0b', // Amber
    description: 'Daily news briefs, press podcasts, and bilingual community reports',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'folder_type_social',
    name: 'Short-form Social Reels',
    categoryType: 'project-type',
    color: '#ec4899', // Pink
    description: '9:16 vertical TikTok, Instagram Reels, and YouTube Shorts with dynamic karaoke subtitles',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'folder_type_audiobook',
    name: 'Audiobook Productions',
    categoryType: 'project-type',
    color: '#8b5cf6', // Purple
    description: 'Long-form spoken word audio, multi-speaker character voice casting, and ACX mastering',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'folder_type_dubbing',
    name: 'Multilingual Dubbing',
    categoryType: 'project-type',
    color: '#06b6d4', // Cyan
    description: 'Khmer-English speech-to-speech synchronization, vocal replacement, and dual SRT tracks',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

