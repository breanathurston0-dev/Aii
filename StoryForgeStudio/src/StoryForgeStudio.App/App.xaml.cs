using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StoryForgeStudio.Core.Interfaces;
using StoryForgeStudio.Infrastructure.Data;
using StoryForgeStudio.Infrastructure.Services;

namespace StoryForgeStudio.App
{
    public partial class App : Application
    {
        private readonly IHost _host;

        public App()
        {
            _host = Host.CreateDefaultBuilder()
                .ConfigureServices((context, services) =>
                {
                    services.AddSingleton<IProjectRepository, SqliteProjectRepository>();
                    services.AddSingleton<IFFmpegService, FFmpegService>();
                    services.AddSingleton<IJobQueueService, JobQueueService>();
                    services.AddSingleton<IVoiceCloningService, VoiceCloningService>();
                    services.AddSingleton<IVocalRemoverService, DemucsSeparationService>();
                    services.AddSingleton<GeminiAiService>();
                    services.AddSingleton<ISummarizerService>(sp => sp.GetRequiredService<GeminiAiService>());
                    services.AddSingleton<ITranslationService>(sp => sp.GetRequiredService<GeminiAiService>());
                    services.AddSingleton<ITextToSpeechService>(sp => sp.GetRequiredService<GeminiAiService>());
                    services.AddSingleton<ITranscriptionService>(sp => sp.GetRequiredService<GeminiAiService>());
                })
                .Build();
        }

        protected override async void OnStartup(StartupEventArgs e)
        {
            await _host.StartAsync();
            base.OnStartup(e);
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            await _host.StopAsync();
            _host.Dispose();
            base.OnExit(e);
        }
    }
}
