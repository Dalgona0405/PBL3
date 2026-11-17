using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ hồ sơ ứng viên, kinh nghiệm làm việc, kỹ năng và phân tích CV bằng AI
    /// </summary>
    public class CandidateService : ICandidateService
    {
        private readonly ICandidateRepository _candidateRepo;
        private readonly IExperienceRepository _experienceRepo;
        private readonly IStorageService _storageService;
        private readonly ITagRepository _tagRepo;
        private readonly HttpClient _httpClient;
        private readonly ILogger<CandidateService> _logger;
        private readonly string _pythonBaseUrl;

        public CandidateService(
            ICandidateRepository candidateRepo,
            IExperienceRepository experienceRepo,
            IStorageService storageService,
            ITagRepository tagRepo,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CandidateService> logger)
        {
            _candidateRepo = candidateRepo;
            _experienceRepo = experienceRepo;
            _storageService = storageService;
            _tagRepo = tagRepo;
            _httpClient = httpClient;
            _logger = logger;
            _pythonBaseUrl = configuration["PythonAI:BaseUrl"] ?? "http://localhost:8000";
        }

        /// <summary>
        /// Lấy hồ sơ chi tiết của ứng viên theo UserId
        /// </summary>
        public async Task<CandidateDetailDTO> GetCandidateByIdAsync(int id)
        {
            var candidate = await _candidateRepo.GetCandidateDetailByIdAsync(id)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng viên.");

            return candidate.ToDetailDto();
        }

        /// <summary>
        /// Cập nhật thông tin hồ sơ cá nhân và danh sách kỹ năng của ứng viên
        /// </summary>
        public async Task UpdateCandidateProfileAsync(int userId, UpdateCandidateDTO dto)
        {
            var existingCandidate = await _candidateRepo.GetCandidateEntityByIdAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng viên.");

            if (existingCandidate.User != null)
            {
                existingCandidate.User.FullName = dto.FullName ?? existingCandidate.User.FullName;
                existingCandidate.User.Avatar = dto.Avatar ?? existingCandidate.User.Avatar;
            }

            existingCandidate.Gender = dto.Gender ?? existingCandidate.Gender;
            existingCandidate.Birthday = dto.Birthday ?? existingCandidate.Birthday;
            existingCandidate.Phone = dto.Phone ?? existingCandidate.Phone;
            existingCandidate.Address = dto.Address ?? existingCandidate.Address;
            existingCandidate.CVUrl = dto.CVUrl ?? existingCandidate.CVUrl;

            await _candidateRepo.UpdateAsync(existingCandidate);

            if (dto.Tags != null)
            {
                await _candidateRepo.UpdateCandidateTagsAsync(userId, dto.Tags);
            }
        }

        /// <summary>
        /// Tìm kiếm ứng viên theo từ khóa và kỹ năng có phân trang
        /// </summary>
        public async Task<PagedResultDTO<CandidateSummaryDTO>> SearchCandidatesAsync(string? keyword, int? tagId, int page, int pageSize)
        {
            return await _candidateRepo.SearchCandidatesAsync(keyword, tagId, page, pageSize);
        }

        /// <summary>
        /// Lấy danh sách kinh nghiệm làm việc của ứng viên
        /// </summary>
        public async Task<IEnumerable<ExperienceDetailDTO>> GetExperiencesAsync(int candidateId)
        {
            var experiences = await _experienceRepo.GetExperiencesByCandidateIdAsync(candidateId);
            return experiences.Select(e => e.ToDetailDto());
        }

        /// <summary>
        /// Thêm mới một mốc kinh nghiệm làm việc cho ứng viên
        /// </summary>
        public async Task<ExperienceDetailDTO> AddExperienceAsync(int userId, CreateExperienceDTO dto)
        {
            var experience = new Experience
            {
                UserId = userId,
                JobTitle = dto.JobTitle,
                CompanyName = dto.CompanyName,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description
            };

            var created = await _experienceRepo.AddExperienceAsync(experience);
            return created.ToDetailDto();
        }

        /// <summary>
        /// Cập nhật một mốc kinh nghiệm làm việc sau khi kiểm tra quyền sở hữu
        /// </summary>
        public async Task<ExperienceDetailDTO> UpdateExperienceAsync(int userId, int expId, UpdateExperienceDTO dto)
        {
            var existing = await _experienceRepo.GetExperienceByIdAsync(expId)
                ?? throw new KeyNotFoundException("Không tìm thấy kinh nghiệm làm việc.");

            if (existing.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền chỉnh sửa kinh nghiệm làm việc này.");

            existing.JobTitle = dto.JobTitle ?? existing.JobTitle;
            existing.CompanyName = dto.CompanyName ?? existing.CompanyName;
            existing.StartDate = dto.StartDate ?? existing.StartDate;
            existing.EndDate = dto.EndDate ?? existing.EndDate;
            existing.Description = dto.Description ?? existing.Description;

            await _experienceRepo.UpdateExperienceAsync(existing);
            return existing.ToDetailDto();
        }

        /// <summary>
        /// Xóa một mốc kinh nghiệm làm việc của ứng viên
        /// </summary>
        public async Task DeleteExperienceAsync(int userId, int expId)
        {
            var existing = await _experienceRepo.GetExperienceByIdAsync(expId)
                ?? throw new KeyNotFoundException("Không tìm thấy kinh nghiệm làm việc.");

            if (existing.UserId != userId)
                throw new ForbiddenAccessException("Bạn không có quyền xóa kinh nghiệm làm việc này.");

            await _experienceRepo.DeleteExperienceAsync(expId);
        }

        /// <summary>
        /// Lấy danh sách kỹ năng của ứng viên
        /// </summary>
        public async Task<IEnumerable<object>> GetCandidateSkillsAsync(int candidateId)
        {
            var skills = await _candidateRepo.GetTagsByCandidateIdAsync(candidateId);
            return skills.Select(s => new
            {
                s.TagId,
                TagName = s.Tag?.TagName,
                s.Proficiency
            });
        }

        /// <summary>
        /// Cập nhật danh sách kỹ năng của ứng viên
        /// </summary>
        public async Task UpdateCandidateSkillsAsync(int userId, List<CandidateTagDTO> dtos)
        {
            await _candidateRepo.UpdateCandidateTagsAsync(userId, dtos);
        }

        /// <summary>
        /// Đặt đường dẫn CV mặc định cho ứng viên
        /// </summary>
        public async Task<string> UpdateDefaultCVAsync(int userId, string cvUrl)
        {
            var candidate = await _candidateRepo.GetCandidateEntityByIdAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ ứng viên.");

            candidate.CVUrl = cvUrl;
            await _candidateRepo.UpdateAsync(candidate);
            return candidate.CVUrl;
        }

        /// <summary>
        /// Lưu tệp PDF CV lên Storage và gọi Python AI Server để bóc tách thông tin tự động (kèm fallback khi AI bận)
        /// </summary>
        public async Task<(ParsedResumeResultDTO? Data, string StoredCvUrl, bool AiSuccess)> ParseResumePdfAsync(
            int userId,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Vui lòng chọn tệp PDF CV để tải lên.");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("Tệp tải lên lớn hơn 5MB. Vui lòng tải tệp khác.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!await FileSignatureValidator.IsValidSignatureAsync(file, ext, cancellationToken))
                throw new ArgumentException("Tệp PDF không hợp lệ hoặc bị hỏng cấu trúc nhị phân.");


            var storedCvUrl = await _storageService.UploadResumePdfAsync(file, userId, cancellationToken);
            await UpdateDefaultCVAsync(userId, storedCvUrl);

            HttpResponseMessage response;
            try
            {
                using var content = new MultipartFormDataContent();
                await using var pdfStream = file.OpenReadStream();
                var streamContent = new StreamContent(pdfStream);
                streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
                content.Add(streamContent, "file", file.FileName);

                response = await _httpClient.PostAsync($"{_pythonBaseUrl}/api/cv/parse", content, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI CV Parser service unreachable for User {UserId}. CV stored at {CvUrl}", userId, storedCvUrl);
                return (null, storedCvUrl, false);
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI CV Parser returned status {StatusCode} for User {UserId}", response.StatusCode, userId);
                return (null, storedCvUrl, false);
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var root = doc.RootElement;

            var rawText = root.TryGetProperty("rawText", out var rt) ? rt.GetString() ?? "" : "";
            var matchedSkills = await ExtractMatchedSkillsAsync(rawText);
            var parsedBirthday = ParseBirthday(root);
            var extractedExps = ExtractExperiences(root);

            var resultDto = new ParsedResumeResultDTO
            {
                CVUrl = storedCvUrl,
                FullName = root.TryGetProperty("fullName", out var fn) ? fn.GetString() : null,
                Email = root.TryGetProperty("email", out var em) ? em.GetString() : null,
                Phone = root.TryGetProperty("phone", out var ph) ? ph.GetString() : null,
                Birthday = parsedBirthday,
                Gender = root.TryGetProperty("gender", out var gd) ? gd.GetString() : null,
                Address = root.TryGetProperty("address", out var ad) ? ad.GetString() : null,
                Education = root.TryGetProperty("education", out var ed) ? ed.GetString() : null,
                MatchedSkills = matchedSkills,
                ExtractedExperiences = extractedExps
            };

            return (resultDto, storedCvUrl, true);
        }

        private async Task<List<TagSummaryDTO>> ExtractMatchedSkillsAsync(string rawText)
        {
            var allDbTags = await _tagRepo.GetAllTagsSummaryAsync();
            var matchedSkills = new List<TagSummaryDTO>();

            foreach (var tag in allDbTags.Where(t => t.Type is TagTypes.Skill or TagTypes.Language or TagTypes.Role or TagTypes.Domain))
            {
                if (string.IsNullOrWhiteSpace(tag.TagName)) continue;

                var escapedTag = Regex.Escape(tag.TagName);
                if (Regex.IsMatch(rawText, $@"(?<![a-zA-Z0-9]){escapedTag}(?![a-zA-Z0-9])", RegexOptions.IgnoreCase))
                {
                    matchedSkills.Add(new TagSummaryDTO
                    {
                        TagId = tag.TagId,
                        TagName = tag.TagName,
                        Type = tag.Type
                    });
                }
            }

            return matchedSkills;
        }

        private static DateTime? ParseBirthday(JsonElement root)
        {
            if (root.TryGetProperty("birthdayRaw", out var dobProp) && dobProp.ValueKind == JsonValueKind.String)
            {
                if (DateTime.TryParseExact(dobProp.GetString(), "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                {
                    return dt;
                }
            }
            return null;
        }

        private static List<CreateExperienceDTO> ExtractExperiences(JsonElement root)
        {
            var extractedExps = new List<CreateExperienceDTO>();
            if (!root.TryGetProperty("experiences", out var expArray) || expArray.ValueKind != JsonValueKind.Array)
            {
                return extractedExps;
            }

            foreach (var item in expArray.EnumerateArray())
            {
                var startRaw = item.TryGetProperty("startDateRaw", out var sProp) ? sProp.GetString() : null;
                var endRaw = item.TryGetProperty("endDateRaw", out var eProp) ? eProp.GetString() : null;

                DateTime startDate = ParseMonthYearOrDefault(startRaw) ?? DateTime.UtcNow.AddYears(-1);
                DateTime? endDate = (endRaw != null && (endRaw.Contains("Hiện tại", StringComparison.OrdinalIgnoreCase) || endRaw.Contains("Present", StringComparison.OrdinalIgnoreCase)))
                    ? null
                    : ParseMonthYearOrDefault(endRaw);

                extractedExps.Add(new CreateExperienceDTO
                {
                    JobTitle = item.TryGetProperty("jobTitle", out var jt) ? jt.GetString() ?? "" : "",
                    CompanyName = item.TryGetProperty("companyName", out var cn) ? cn.GetString() ?? "" : "",
                    StartDate = startDate,
                    EndDate = endDate,
                    Description = item.TryGetProperty("description", out var desc) ? desc.GetString() : null
                });
            }

            return extractedExps;
        }

        private static DateTime? ParseMonthYearOrDefault(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            if (DateTime.TryParseExact(raw.Trim(), new[] { "MM/yyyy", "M/yyyy", "yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                return dt;
            return null;
        }
    }
}
