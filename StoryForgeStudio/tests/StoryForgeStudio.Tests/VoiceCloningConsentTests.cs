using System;
using System.IO;
using System.Threading.Tasks;
using StoryForgeStudio.Core.Services;
using StoryForgeStudio.Infrastructure.Services;
using Xunit;

namespace StoryForgeStudio.Tests
{
    public class VoiceCloningConsentTests
    {
        [Fact]
        public async Task RegisterVoice_WithoutConsent_ShouldThrowInvalidOperationException()
        {
            var service = new VoiceCloningService();

            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await service.RegisterVoiceWithConsentAsync(
                    profileName: "Celebrity Imitation",
                    ownerName: "Unauthorized Person",
                    referenceAudioPath: "dummy.wav",
                    language: "km",
                    consentVerified: false);
            });
        }

        [Fact]
        public void KhmerUnicodeUtility_ShouldRecognizeKhmerCharacters()
        {
            string khmer = "ភាសាខ្មែរ";
            string english = "StoryForge Studio";

            Assert.True(KhmerUnicodeUtility.ContainsKhmer(khmer));
            Assert.False(KhmerUnicodeUtility.ContainsKhmer(english));
            Assert.Equal(9, KhmerUnicodeUtility.CountKhmerCharacters(khmer));
        }

        [Fact]
        public void KhmerWordTokenization_ShouldHandleZeroWidthSpaces()
        {
            string compound = "រឿង\u200Bនិទាន\u200Bខ្មែរ";
            var tokens = KhmerUnicodeUtility.TokenizeWords(compound);
            Assert.Equal(3, tokens.Length);
        }
    }
}
