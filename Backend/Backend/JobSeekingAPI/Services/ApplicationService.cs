using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly IApplicationRepository _appRepo;
        private readonly IJobRepository _jobRepo;
        private readonly ICandidateRepository _candidateRepo;
        public ApplicationService(IApplicationRepository appRepo, IJobRepository jobRepo, ICandidateRepository candidateRepo)
        {
            _appRepo = appRepo;
            _jobRepo = jobRepo;
            _candidateRepo = candidateRepo;
        }

        public async Task<Application> ApplyForJobAsync(CreateApplicationDTO dto)
        {
            var candidate = await _candidateRepo.GetByIdAsync(dto.UserId);
            if (candidate == null)
                throw new ArgumentException("Candidate not found!");

            var job = await _jobRepo.GetByIdAsync(dto.JobId);
            if (job == null)
                throw new ArgumentException("Job not found!");

            if (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow)
                throw new ArgumentException("This job is already expired!");

            var hasApplied = await _appRepo.IsAppliedAsync(dto.UserId, dto.JobId);
            if (hasApplied)
                throw new ArgumentException("You have already applied for this job!");

            string finalCvUrl = dto.CVUrl ?? "";
            if (string.IsNullOrWhiteSpace(finalCvUrl))
            {
                finalCvUrl = candidate.CVUrl ?? "";
                if (string.IsNullOrWhiteSpace(finalCvUrl))
                    throw new ArgumentException("Please provide a CV to apply");
            }

            var application = new Application
            {
                UserId = dto.UserId,
                JobId = dto.JobId,
                CVUrl = finalCvUrl,
            };

            return await _appRepo.CreateApplicationDetailAsync(application);
        }
    }
}