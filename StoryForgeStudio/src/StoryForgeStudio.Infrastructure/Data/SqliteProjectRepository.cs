using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using StoryForgeStudio.Core.Interfaces;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Infrastructure.Data
{
    public class SqliteProjectRepository : IProjectRepository
    {
        private readonly string _connectionString;
        private readonly string _dbPath;

        public SqliteProjectRepository(string? customDbPath = null)
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var folder = Path.Combine(appData, "StoryForgeStudio");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            _dbPath = customDbPath ?? Path.Combine(folder, "storyforge.db");
            _connectionString = new SqliteConnectionStringBuilder
            {
                DataSource = _dbPath,
                Mode = SqliteOpenMode.ReadWriteCreate
            }.ToString();

            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            using var conn = new SqliteConnection(_connectionString);
            conn.Open();

            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS SchemaMigrations (
                    Version INTEGER PRIMARY KEY,
                    AppliedAt TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS Projects (
                    Id TEXT PRIMARY KEY,
                    Name TEXT NOT NULL,
                    Description TEXT,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NOT NULL,
                    TargetLanguage TEXT,
                    SourceLanguage TEXT,
                    DurationSeconds REAL,
                    JsonData TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_projects_updated ON Projects(UpdatedAt DESC);
            ";
            cmd.ExecuteNonQuery();

            // Run migration v1
            var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = "SELECT COUNT(*) FROM SchemaMigrations WHERE Version = 1;";
            long count = (long)(checkCmd.ExecuteScalar() ?? 0);
            if (count == 0)
            {
                var migCmd = conn.CreateCommand();
                migCmd.CommandText = "INSERT INTO SchemaMigrations (Version, AppliedAt) VALUES (1, $now);";
                migCmd.Parameters.AddWithValue("$now", DateTime.UtcNow.ToString("o"));
                migCmd.ExecuteNonQuery();
            }
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            var list = new List<Project>();
            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT JsonData FROM Projects ORDER BY UpdatedAt DESC;";

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var json = reader.GetString(0);
                var project = JsonSerializer.Deserialize<Project>(json);
                if (project != null)
                {
                    list.Add(project);
                }
            }

            return list;
        }

        public async Task<Project?> GetProjectByIdAsync(string id)
        {
            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT JsonData FROM Projects WHERE Id = $id;";
            cmd.Parameters.AddWithValue("$id", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var json = reader.GetString(0);
                return JsonSerializer.Deserialize<Project>(json);
            }

            return null;
        }

        public async Task SaveProjectAsync(Project project)
        {
            project.UpdatedAt = DateTime.UtcNow;
            var json = JsonSerializer.Serialize(project);

            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Projects (Id, Name, Description, CreatedAt, UpdatedAt, TargetLanguage, SourceLanguage, DurationSeconds, JsonData)
                VALUES ($id, $name, $desc, $created, $updated, $target, $source, $dur, $json)
                ON CONFLICT(Id) DO UPDATE SET
                    Name = excluded.Name,
                    Description = excluded.Description,
                    UpdatedAt = excluded.UpdatedAt,
                    TargetLanguage = excluded.TargetLanguage,
                    SourceLanguage = excluded.SourceLanguage,
                    DurationSeconds = excluded.DurationSeconds,
                    JsonData = excluded.JsonData;
            ";
            cmd.Parameters.AddWithValue("$id", project.Id);
            cmd.Parameters.AddWithValue("$name", project.Name);
            cmd.Parameters.AddWithValue("$desc", project.Description);
            cmd.Parameters.AddWithValue("$created", project.CreatedAt.ToString("o"));
            cmd.Parameters.AddWithValue("$updated", project.UpdatedAt.ToString("o"));
            cmd.Parameters.AddWithValue("$target", project.TargetLanguage);
            cmd.Parameters.AddWithValue("$source", project.SourceLanguage);
            cmd.Parameters.AddWithValue("$dur", project.DurationSeconds);
            cmd.Parameters.AddWithValue("$json", json);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task DeleteProjectAsync(string id)
        {
            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM Projects WHERE Id = $id;";
            cmd.Parameters.AddWithValue("$id", id);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}
