using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
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

        public async Task<Job> CreateJobAsync(CreateJobDTO dto)
        {
            if (dto.Deadline.HasValue && dto.Deadline.Value < DateTime.UtcNow)
                throw new ArgumentException("Deadline cannot be in the past!");

            var job = new Job
            {
                CompanyId = dto.CompanyId,
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

            return await _jobRepo.CreateJobWithDefaultsAsync(job);
        }

        public async Task UpdateJobAsync(int id, UpdateJobDTO dto, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Job not found");

            // Kiểm tra quyền sở hữu
            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, userId, isRecruiter);

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

        public async Task UpdateJobStatusAsync(int id, JobUpdateStatusDTO dto, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Job not found");

            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, userId, isRecruiter);

            existingJob.Status = dto.Status;
            await _jobRepo.UpdateAsync(existingJob);
        }

        public async Task DeleteJobAsync(int id, int userId, bool isRecruiter)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(id);
            if (existingJob == null)
                throw new KeyNotFoundException("Job not found");

            await CheckRecruiterOwnershipAsync(existingJob.CompanyId, userId, isRecruiter);

            await _jobRepo.SoftDeleteJobAsync(id);
        }

        public async Task SaveJobAsync(int userId, int jobId)
        {
            var existingJob = await _jobRepo.GetJobEntityByIdAsync(jobId);
            if (existingJob == null)
                throw new KeyNotFoundException("Job not found");

            await _candidateRepo.SaveJobAsync(userId, jobId);
        }

        public async Task UnsaveJobAsync(int userId, int jobId)
        {
            await _candidateRepo.UnsaveJobAsync(userId, jobId);
        }

        public async Task<IEnumerable<JobSummaryDTO>> GetSavedJobsAsync(int userId)
        {
            return await _candidateRepo.GetSavedJobsAsync(userId);
        }

        // Hàm dùng chung để kiểm tra xem Recruiter có quyền sửa/xóa Job của công ty này không
        private async Task CheckRecruiterOwnershipAsync(int jobCompanyId, int userId, bool isRecruiter)
        {
            if (isRecruiter)
            {
                var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
                if (recruiterCompanyId == null || recruiterCompanyId != jobCompanyId)
                {
                    throw new UnauthorizedAccessException("You do not have permission to modify this job.");
                }
            }
        }
    }
}