import JSZip from 'jszip';
import { downloadBlob } from './exportZipService';

export interface CSharpFileEntry {
  path: string;
  category: 'Solution' | 'Core' | 'Infrastructure' | 'App' | 'Tests';
  content: string;
}

export const CSHARP_FILES: CSharpFileEntry[] = [
  {
    path: 'StoryForgeStudio.sln',
    category: 'Solution',
    content: `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.8.34330.188
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "StoryForgeStudio.Core", "src\\StoryForgeStudio.Core\\StoryForgeStudio.Core.csproj", "{11111111-1111-1111-1111-111111111111}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "StoryForgeStudio.Infrastructure", "src\\StoryForgeStudio.Infrastructure\\StoryForgeStudio.Infrastructure.csproj", "{22222222-2222-2222-2222-222222222222}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "StoryForgeStudio.App", "src\\StoryForgeStudio.App\\StoryForgeStudio.App.csproj", "{33333333-3333-3333-3333-333333333333}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "StoryForgeStudio.Tests", "tests\\StoryForgeStudio.Tests\\StoryForgeStudio.Tests.csproj", "{44444444-4444-4444-4444-444444444444}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
EndGlobal`,
  },
  {
    path: 'src/StoryForgeStudio.Core/Models/Project.cs',
    category: 'Core',
    content: `using System;
using System.Collections.Generic;

namespace StoryForgeStudio.Core.Models
{
    public class Project
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "Untitled Project";
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string SourceLanguage { get; set; } = "km";
        public string TargetLanguage { get; set; } = "en";
        public double DurationSeconds { get; set; }

        public List<MediaItem> MediaFiles { get; set; } = new();
        public List<TranscriptSegment> TranscriptSegments { get; set; } = new();
        public List<SubtitleEntry> Subtitles { get; set; } = new();
        public StorySummaryResult? Summary { get; set; }
        public Dictionary<string, string> VoiceMappings { get; set; } = new();
        public SubtitleStyleConfig SubtitleStyle { get; set; } = new();
    }
}`,
  },
  {
    path: 'src/StoryForgeStudio.Core/Services/SrtParser.cs',
    category: 'Core',
    content: `using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Core.Services
{
    public static class SrtParser
    {
        public static string SecondsToTimestamp(double seconds)
        {
            var ts = TimeSpan.FromSeconds(Math.Max(0, seconds));
            return string.Format(CultureInfo.InvariantCulture, "{0:D2}:{1:D2}:{2:D2},{3:D3}",
                (int)ts.TotalHours, ts.Minutes, ts.Seconds, ts.Milliseconds);
        }

        public static double TimestampToSeconds(string timestamp)
        {
            var clean = timestamp.Trim().Replace('.', ',');
            var parts = clean.Split(':');
            if (parts.Length < 3) return 0;
            double hours = double.Parse(parts[0], CultureInfo.InvariantCulture);
            double minutes = double.Parse(parts[1], CultureInfo.InvariantCulture);
            var secParts = parts[2].Split(',');
            double seconds = double.Parse(secParts[0], CultureInfo.InvariantCulture);
            double millis = secParts.Length > 1 ? double.Parse(secParts[1].PadRight(3, '0').Substring(0, 3), CultureInfo.InvariantCulture) : 0;
            return hours * 3600 + minutes * 60 + seconds + millis / 1000.0;
        }

        public static List<SubtitleEntry> Parse(string srtContent)
        {
            var entries = new List<SubtitleEntry>();
            if (string.IsNullOrWhiteSpace(srtContent)) return entries;
            var normalized = srtContent.Replace("\\r\\n", "\\n").Replace('\\r', '\\n');
            var rawBlocks = Regex.Split(normalized, @"\\n\\s*\\n");
            int id = 1;
            foreach (var block in rawBlocks)
            {
                var lines = block.Trim().Split('\\n').Select(l => l.Trim()).Where(l => l.Length > 0).ToList();
                int timeIdx = lines.FindIndex(l => l.Contains("-->"));
                if (timeIdx == -1) continue;
                var parts = lines[timeIdx].Split(new[] { "-->" }, StringSplitOptions.None);
                if (parts.Length != 2) continue;
                var startSec = TimestampToSeconds(parts[0]);
                var endSec = TimestampToSeconds(parts[1]);
                var text = string.Join("\\n", lines.Skip(timeIdx + 1));
                entries.Add(new SubtitleEntry
                {
                    Id = id++,
                    StartTime = SecondsToTimestamp(startSec),
                    EndTime = SecondsToTimestamp(endSec),
                    StartSeconds = startSec,
                    EndSeconds = endSec,
                    Text = text
                });
            }
            return entries;
        }
    }
}`,
  },
  {
    path: 'src/StoryForgeStudio.Infrastructure/Services/FFmpegService.cs',
    category: 'Infrastructure',
    content: `using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using StoryForgeStudio.Core.Interfaces;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Infrastructure.Services
{
    public class FFmpegService : IFFmpegService
    {
        private readonly string _ffmpegPath = "ffmpeg";

        public async Task<string> BurnSubtitlesAsync(string videoPath, string srtPath, SubtitleStyleConfig style, string outputPath, IProgress<int>? progress = null, CancellationToken ct = default)
        {
            string escapedSrt = srtPath.Replace("\\\\", "/").Replace(":", "\\\\:");
            string filter = $"subtitles='{escapedSrt}':force_style='FontName={style.FontFamily},FontSize={style.FontSize},PrimaryColour=&H{style.FontColor.Replace("#", "")}&,Outline={style.OutlineWidth}'";

            var psi = new ProcessStartInfo
            {
                FileName = _ffmpegPath,
                Arguments = $"-y -i \\"{videoPath}\\" -vf \\"{filter}\\" -c:a copy \\"{outputPath}\\"",
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var proc = Process.Start(psi);
            if (proc == null) throw new InvalidOperationException("Failed to spawn ffmpeg");
            await proc.WaitForExitAsync(ct);
            return outputPath;
        }
    }
}`,
  },
  {
    path: 'src/StoryForgeStudio.App/MainWindow.xaml',
    category: 'App',
    content: `<Window x:Class="StoryForgeStudio.App.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="StoryForge Studio" Height="850" Width="1350">
    <Grid>
        <!-- 18-module navigation, video timeline, and canvas preview -->
    </Grid>
</Window>`,
  },
  {
    path: 'tests/StoryForgeStudio.Tests/SrtParserTests.cs',
    category: 'Tests',
    content: `using StoryForgeStudio.Core.Services;
using Xunit;

namespace StoryForgeStudio.Tests
{
    public class SrtParserTests
    {
        [Fact]
        public void TimestampConversion_ShouldRoundTripPrecisely()
        {
            double sec = 3661.425;
            string ts = SrtParser.SecondsToTimestamp(sec);
            Assert.Equal("01:01:01,425", ts);
            Assert.Equal(sec, SrtParser.TimestampToSeconds(ts), precision: 3);
        }
    }
}`,
  },
];

export async function downloadCSharpSolutionZip() {
  const zip = new JSZip();
  for (const file of CSHARP_FILES) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'StoryForgeStudio_CSharp_NET8_WPF_Solution.zip');
}
