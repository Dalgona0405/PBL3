using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecruitersController : ControllerBase
    {
        private readonly IRecruiterRepository _recruiterRepository;
        private readonly ICompanyRepository _companyRepository;

        public RecruitersController(IRecruiterRepository recruiterRepository, ICompanyRepository companyRepository)
        {
            _recruiterRepository = recruiterRepository;
            _companyRepository = companyRepository;
        }

        // GET: api/recruiters => Cân nhắc bỏ
        //[Authorize(Roles = "Admin")]
        //[HttpGet]
        //public async Task<IActionResult> GetAllRecruiters()
        //{
        //    var recruiters = await _recruiterRepository.GetAllRecruitersWithDetailsAsync();
        //    var dtos = recruiters.Select(r => MapToDTO(r));
        //    return Ok(dtos);
        //}

        // GET: api/recruiters/{id}
        [Authorize(Roles = "Admin, Recruiter")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecruiterById(int id)
        {
            var recruiter = await _recruiterRepository.GetRecruiterDetailByIdAsync(id);
            if (recruiter == null)
                return NotFound(new { message = "Recruiter not found" });
            return Ok(recruiter);
        }

        // GET: api/recruiters/company/{companyId}
        [Authorize(Roles = "Admin, Recruiter")]
        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetRecruitersByCompany(int companyId)
        {
            var companyExists = await _companyRepository.GetByIdAsync(companyId);
            if (companyExists == null)
                return NotFound(new { message = "Company not found!" });

            var recruiters = await _recruiterRepository.GetRecruitersByCompanyAsync(companyId);
            var dtos = recruiters.Select(r => new RecruiterSummaryDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Position = r.Position
            });
            return Ok(dtos);
        }

        // PUT: api/recruiters/{id}
        [Authorize(Roles = "Recruiter")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecruiter(int id, [FromBody] UpdateRecruiterDTO dto)
        {
            var existingRecruiter = await _recruiterRepository.GetRecruiterEntityByIdAsync(id);
            if (existingRecruiter == null)
                return NotFound("Recruiter not found");

            if (existingRecruiter.User != null)
            {
                existingRecruiter.User.FullName = dto.FullName ?? existingRecruiter.User.FullName;
                existingRecruiter.User.Avatar = dto.Avatar ?? existingRecruiter.User.Avatar;
            }

            // Update Recruiter
            existingRecruiter.Position = dto.Position ?? existingRecruiter.Position;

            if (dto.CompanyId.HasValue && dto.CompanyId != existingRecruiter.CompanyId)
            {
                var companyExists = await _companyRepository.GetByIdAsync(dto.CompanyId.Value);
                if (companyExists == null) return BadRequest(new { message = "New company does not exist!" });
                existingRecruiter.CompanyId = dto.CompanyId.Value;
            }

            await _recruiterRepository.UpdateAsync(existingRecruiter);
            return Ok(new { message = "Update success" });
        }

        private RecruiterDetailDTO MapToDTO(Recruiter r)
        {
            return new RecruiterDetailDTO
            {
                UserId = r.UserId,
                FullName = r.User?.FullName ?? "Unknown",
                Email = r.User?.Email ?? "Unknown",
                Avatar = r.User?.Avatar,
                Position = r.Position,
                LastLogin = r.User?.LastLogin,

                Company = r.Company == null ? null : new CompanySummaryDTO
                {
                    CompanyId = r.Company.CompanyId,
                    CompanyName = r.Company.CompanyName,
                    LogoImg = r.Company.LogoImg,
                    Website = r.Company.Website
                },

                Jobs = r.Company?.Jobs?.Select(j => new JobSummaryDTO
                {
                    JobId = j.JobId,
                    Title = j.Title,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    LocationName = j.Location?.LocationName,
                    Deadline = j.Deadline
                }).ToList() ?? new List<JobSummaryDTO>()
            };
        }
    }
}