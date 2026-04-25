using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;
using Microsoft.AspNetCore.Authorization;
using JobSeekingAPI.Helpers;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyRepository _companyRepo;
        private readonly IJobRepository _jobRepository;

        public CompaniesController(ICompanyRepository companyRepo, IJobRepository jobRepository)
        {
            _companyRepo = companyRepo;
            _jobRepository = jobRepository;
        }

        // GET: api/companies
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _companyRepo.GetAllCompaniesSummaryAsync();
            return Ok(companies);
        }

        // GET: api/companies/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            var company = await _companyRepo.GetCompanyDetailByIdAsync(id);
            if (company == null)
                return NotFound(new { message = "Company not found" });
            return Ok(company);
        }

        // GET: api/companies/recruiters/{recruiterId}
        [Authorize(Roles = "Admin, Recruiter")]
        [HttpGet("recruiters/{recruiterId}")]
        public async Task<IActionResult> GetCompanyIdByRecruiterId(int recruiterId)
        {
            var userId = User.GetUserIdFromToken();
            if (User.IsInRole("Recruiter") && userId != recruiterId)
                return Forbid();

            var companyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(recruiterId);
            if (companyId == null)
                return NotFound(new { message = "Company not found for the given recruiter" });

            return Ok(new { CompanyId = companyId });
        }

        // POST: api/companies
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDTO dto)
        {
            var company = new Company
            {
                CompanyName = dto.CompanyName,
                LogoImg = dto.LogoImg,
                Website = dto.Website,
                Size = dto.Size
            };
            await _companyRepo.CreateAsync(company);
            return CreatedAtAction(nameof(GetCompanyById), new { id = company.CompanyId }, company);
        }

        // PUT: api/companies/{id}
        [Authorize(Roles = "Admin, Recruiter")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyDTO dto)
        {
            var userId = User.GetUserIdFromToken();
            var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(userId);
            if (recruiterCompanyId == null || recruiterCompanyId != id)
            {
                return Forbid();
            }

            var existingCompany = await _companyRepo.GetCompanyEntityByIdAsync(id);
            if (existingCompany == null || existingCompany.DeletedAt != null)
                return NotFound(new { message = "Company not found" });

            existingCompany.CompanyName = dto.CompanyName ?? existingCompany.CompanyName;
            existingCompany.LogoImg = dto.LogoImg ?? existingCompany.LogoImg;
            existingCompany.Website = dto.Website ?? existingCompany.Website;
            existingCompany.Size = dto.Size ?? existingCompany.Size;

            await _companyRepo.UpdateAsync(existingCompany);
            return Ok(new { message = "Update success" });
        }

        // DELETE: api/companies/{id}
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            var result = await _companyRepo.SoftDeleteCompanyAsync(id);
            if (result == "Company not found")
                return NotFound(new { message = "Company not found" });

            if (result == "Has active jobs")
                return BadRequest(new { message = "Cannot delete company with active jobs" });

            return Ok(new { message = "Detele success" });
        }

        // GET: api/companies/search
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> SearchCompanies(
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _companyRepo.SearchCompaniesAsync(keyword, page, pageSize);
            return Ok(result);
        }

        // GET: api/companies/{id}/jobs => đã có ở JobController, nếu muốn lấy thông tin công ty kèm theo danh sách việc làm thì có thể gọi api này ở JobController
        //[HttpGet("{id}/jobs")]
        //public async Task<IActionResult> GetCompanyJobs(int id)
        //{
        //    var company = await _companyRepository.GetCompanyEntityByIdAsync(id);
        //    if (company == null)
        //        return NotFound(new { message = "Company not found" });

        //    var jobs = await _jobRepository.GetJobsByCompanyAsync(id);
        //    return Ok(jobs);
        //}
    }
}