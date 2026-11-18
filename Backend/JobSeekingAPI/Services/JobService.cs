using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Xử lý nghiệp vụ quản lý tin tuyển dụng, tìm kiếm việc làm và lưu trữ bookmark
    /// </summary>
    public class JobService : IJobService
    {
        private readonly IJobRepository _jobRepo;
        private readonly ICompanyRepository _companyRepo;
        private readonly ICandidateRepository _candidateRepo;

        public JobService(IJobRepository jobRepo, ICompanyRepository companyRepo, ICandidateRepository candidateRepo)
        {
            _jobRepo = jobRepo;
            _companyRepo = companyRepo;
            _candidateRepo = candidateRepo;
        }

        /// <summary>
        /// Lấy chi tiết tin tuyển dụng và tăng lượt xem
        /// </summary>
        public async Task<JobDetailDTO> GetJobByIdAsync(int id)
        {
            var jobDto = await _jobRepo.GetJobDetailByIdAsync(id);
            if (jobDto == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            await _jobRepo.IncrementViewCountAsync(id);
            return jobDto;
        }

        /// <summary>
        /// Tìm kiếm tin tuyển dụng theo bộ lọc nâng cao và phân trang
        /// </summary>
        public async Task<PagedResultDTO<JobDetailDTO>> SearchJobsAsync(JobSearchDTO searchParams)
        {
            var result = await _jobRepo.SearchJobsAsync(searchParams);
            return new PagedResultDTO<JobDetailDTO>
            {
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize,
                TotalPages = result.TotalPages,
                Items = result.Items.Select(j => j.ToDetailDto()).ToList()
            };
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng mới đăng gần đây
        /// </summary>
        public async Task<IEnumerable<JobDetailDTO>> GetRecentJobsAsync(int count)
        {
            var jobs = await _jobRepo.GetRecentJobsAsync(count);
            return jobs.Select(j => j.ToDetailDto());
        }

        /// <summary>
        /// Lấy toàn bộ tin tuyển dụng thuộc một doanh nghiệp
        /// </summary>
        public async Task<IEnumerable<JobDetailDTO>> GetJobsByCompanyAsync(int companyId)
        {
            var jobs = await _jobRepo.GetJobsByCompanyAsync(companyId);
            return jobs.Select(j => j.ToDetailDto());
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng của Nhà tuyển dụng hiện tại (bao gồm cả Freelance Recruiter)
        /// </summary>
        public async Task<IEnumerable<JobDetailDTO>> GetMyJobsAsync(int currentUserId)
        {
            var jobs = await _jobRepo.GetJobsByRecruiterAsync(currentUserId);
            return jobs.Select(j => j.ToDetailDto());
        }

        /// <summary>
        /// Tạo tin tuyển dụng mới (Hỗ trợ cả Recruiter thuộc doanh nghiệp và Freelance Recruiter chưa liên kết công ty)
        /// </summary>
        public async Task<JobDetailDTO> CreateJobAsync(CreateJobDTO dto, int userId, bool isAdmin)
        {
            if (!isAdmin)
            {
                var myCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
                dto.CompanyId = myCompanyId;
            }

            if (dto.Deadline.HasValue && dto.Deadline.Value < DateTime.UtcNow)
                throw new ArgumentException("Hạn nộp hồ sơ không được ở trong quá khứ.");

            var job = new Job
            {
                CompanyId = dto.CompanyId,
                PostedByUserId = userId,
                LocationId = dto.LocationId,
                Title = dto.Title,
                SalaryMin = dto.SalaryMin,
                SalaryMax = dto.SalaryMax,
                ExpYear = dto.ExpYear,
                Level = dto.Level,
                Deadline = dto.Deadline,
                Description = dto.Description,
                Requirement = dto.Requirement,
                Benefits = dto.Benefits,
                Address = dto.Address,
                JobTags = dto.TagIds?.Select(tagId => new JobTag { TagId = tagId }).ToList() ?? new List<JobTag>()
            };

            var createdJob = await _jobRepo.CreateJobWithDefaultsAsync(job);
            return (await _jobRepo.GetJobDetailByIdAsync(createdJob.JobId)) ?? createdJob.ToDetailDto();
        }

        /// <summary>
        /// Cập nhật nội dung tin tuyển dụng sau khi xác minh quyền sở hữu công ty
        /// </summary>
        public async Task UpdateJobAsync(int id, UpdateJobDTO dto, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            // Kiểm tra quyền sở hữu
            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, existingJob.PostedByUserId, userId, isRecruiter);

            // Cập nhật thông tin
            existingJob.Title = dto.Title ?? existingJob.Title;
            existingJob.LocationId = dto.LocationId ?? existingJob.LocationId;
            existingJob.SalaryMin = dto.SalaryMin ?? existingJob.SalaryMin;
            existingJob.SalaryMax = dto.SalaryMax ?? existingJob.SalaryMax;
            existingJob.ExpYear = dto.ExpYear ?? existingJob.ExpYear;
            existingJob.Level = dto.Level ?? existingJob.Level;
            existingJob.Deadline = dto.Deadline ?? existingJob.Deadline;
            existingJob.Description = dto.Description ?? existingJob.Description;
            existingJob.Requirement = dto.Requirement ?? existingJob.Requirement;
            existingJob.Benefits = dto.Benefits ?? existingJob.Benefits;
            existingJob.Address = dto.Address ?? existingJob.Address;
            existingJob.Status = dto.Status ?? existingJob.Status;

            await _jobRepo.UpdateJobWithTagsAsync(existingJob, dto.TagIds);
        }

        /// <summary>
        /// Thay đổi trạng thái đóng/mở của tin tuyển dụng
        /// </summary>
        public async Task UpdateJobStatusAsync(int id, JobUpdateStatusDTO dto, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, existingJob.PostedByUserId, userId, isRecruiter);

            existingJob.Status = dto.Status;
            await _jobRepo.UpdateAsync(existingJob);
        }

        /// <summary>
        /// Xóa mềm tin tuyển dụng sau khi xác minh quyền sở hữu
        /// </summary>
        public async Task DeleteJobAsync(int id, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, existingJob.PostedByUserId, userId, isRecruiter);

            await _jobRepo.SoftDeleteJobAsync(id);
        }

        /// <summary>
        /// Lưu tin tuyển dụng vào danh sách quan tâm của ứng viên
        /// </summary>
        public async Task SaveJobAsync(int userId, int jobId)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(jobId);
            if (existingJob == null)
                throw new KeyNotFoundException("Không tìm thấy tin tuyển dụng.");

            await _candidateRepo.SaveJobAsync(userId, jobId);
        }

        /// <summary>
        /// Bỏ lưu tin tuyển dụng khỏi danh sách quan tâm
        /// </summary>
        public async Task UnsaveJobAsync(int userId, int jobId)
        {
            await _candidateRepo.UnsaveJobAsync(userId, jobId);
        }

        /// <summary>
        /// Lấy danh sách tin tuyển dụng đã lưu của ứng viên
        /// </summary>
        public async Task<IEnumerable<JobSummaryDTO>> GetSavedJobsAsync(int userId)
        {
            return await _candidateRepo.GetSavedJobsAsync(userId);
        }

        /// <summary>
        /// Cập nhật cờ bật/tắt hiển thị các tin tuyển dụng tổng hợp trên toàn hệ thống
        /// </summary>
        public bool ToggleScrapedJobsVisibility(bool show)
        {
            JobRepository.ShowScrapedJobs = show;
            return JobRepository.ShowScrapedJobs;
        }

        /// <summary>
        /// Lấy trạng thái bật/tắt hiển thị hiện tại của tin tuyển dụng tổng hợp
        /// </summary>
        public bool GetScrapedJobsVisibility()
        {
            return JobRepository.ShowScrapedJobs;
        }

        // Hàm dùng chung để kiểm tra xem Recruiter có quyền sửa/xóa Job không (cho phép cả Freelance Recruiter sở hữu tin mình đăng)
        private async Task CheckRecruiterOwnershipAsync(int? jobCompanyId, int? jobPostedByUserId, int userId, bool isRecruiter)
        {
            if (!isRecruiter) return;
            if (jobCompanyId.HasValue)
            {
                var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
                if (recruiterCompanyId == null || recruiterCompanyId.Value != jobCompanyId.Value)
                {
                    throw new ForbiddenAccessException("Bạn không còn trực thuộc doanh nghiệp sở hữu tin tuyển dụng này.");
                }
                return;
            }
            if (!jobPostedByUserId.HasValue || jobPostedByUserId.Value != userId)
                throw new ForbiddenAccessException("Bạn không có quyền chỉnh sửa tin tuyển dụng của nhà tuyển dụng khác");
        }
    }
}