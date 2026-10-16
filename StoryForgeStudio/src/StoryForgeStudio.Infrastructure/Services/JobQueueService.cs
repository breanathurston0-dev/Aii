using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using StoryForgeStudio.Core.Interfaces;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Infrastructure.Services
{
    public class JobQueueService : IJobQueueService
    {
        private readonly ConcurrentDictionary<string, JobRecord> _jobs = new();
        private readonly ConcurrentDictionary<string, CancellationTokenSource> _cts = new();

        public event EventHandler<JobRecord>? JobStatusChanged;

        public IReadOnlyList<JobRecord> GetJobs()
        {
            return _jobs.Values.OrderByDescending(j => j.StartedAt).ToList();
        }

        public async Task<string> EnqueueJobAsync(string type, string title, Func<IProgress<int>, CancellationToken, Task<string>> executionWork)
        {
            var job = new JobRecord
            {
                Type = type,
                Title = title,
                Status = JobState.Queued,
                ProgressPercentage = 0,
                StartedAt = DateTime.UtcNow
            };

            _jobs[job.Id] = job;
            JobStatusChanged?.Invoke(this, job);

            var cts = new CancellationTokenSource();
            _cts[job.Id] = cts;

            // Run in background without blocking UI
            _ = Task.Run(async () =>
            {
                job.Status = JobState.Running;
                job.Logs.Add($"[{DateTime.UtcNow:HH:mm:ss}] Job started: {title}");
                JobStatusChanged?.Invoke(this, job);

                var progress = new Progress<int>(percent =>
                {
                    job.ProgressPercentage = percent;
                    JobStatusChanged?.Invoke(this, job);
                });

                try
                {
                    var result = await executionWork(progress, cts.Token);
                    job.Status = JobState.Completed;
                    job.ProgressPercentage = 100;
                    job.CompletedAt = DateTime.UtcNow;
                    job.Logs.Add($"[{DateTime.UtcNow:HH:mm:ss}] Completed successfully. Output: {result}");
                }
                catch (OperationCanceledException)
                {
                    job.Status = JobState.Cancelled;
                    job.Logs.Add($"[{DateTime.UtcNow:HH:mm:ss}] Job was cancelled by user.");
                }
                catch (Exception ex)
                {
                    job.Status = JobState.Failed;
                    job.ErrorMessage = ex.Message;
                    job.Logs.Add($"[{DateTime.UtcNow:HH:mm:ss}] Error: {ex.Message}");
                }
                finally
                {
                    _cts.TryRemove(job.Id, out _);
                    JobStatusChanged?.Invoke(this, job);
                }
            });

            return job.Id;
        }

        public void CancelJob(string jobId)
        {
            if (_cts.TryGetValue(jobId, out var cts))
            {
                cts.Cancel();
            }
        }
    }
}
