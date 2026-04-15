using Microsoft.AspNetCore.Mvc;
using JobSeekingAPI.Repositories;
using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly IJobRepository _jobRepository;

        public CompaniesController(ICompanyRepository companyRepository, IJobRepository jobRepository) 
        {
            _companyRepository = companyRepository;
            _jobRepository = jobRepository;
        }

        // GET: api/companies
        [HttpGet]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _companyRepository.GetAllCompaniesSummaryAsync();
            return Ok(companies);
        }

        // GET: api/companies/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompanyById(int id)
        {
            var company = await _companyRepository.GetCompanyDetailByIdAsync(id);
            if (company == null)
                return NotFound(new {message = "Company not found"});

            return Ok(company);
        }

        // POST: api/companies
        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDTO createCompanyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var company = new Company
            {
                CompanyName = createCompanyDto.CompanyName,
                LogoImg = createCompanyDto.LogoImg,
                Website = createCompanyDto.Website,
                Size = createCompanyDto.Size
            };
            await _companyRepository.CreateAsync(company);
            return Ok(new {message = "Create success", data = company });
        }

        // PUT: api/companies/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] UpdateCompanyDTO updateCompanyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingCompany = await _companyRepository.GetCompanyEntityByIdAsync(id);
            if (existingCompany == null || existingCompany.DeletedAt != null)
                return NotFound(new { message = "Company not found" });

            existingCompany.CompanyName = updateCompanyDto.CompanyName ?? existingCompany.CompanyName;
            existingCompany.LogoImg = updateCompanyDto.LogoImg ?? existingCompany.LogoImg;
            existingCompany.Website = updateCompanyDto.Website ?? existingCompany.Website;
            existingCompany.Size = updateCompanyDto.Size ?? existingCompany.Size;

            await _companyRepository.UpdateAsync(existingCompany);
            return Ok(new { message = "Update success" });
        }

        // DELETE: api/companies/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            var result = await _companyRepository.SoftDeleteCompanyAsync(id);
            if (result == "Company not found")
                return NotFound(new { message = "Company not found" });

            if (result == "Has active jobs")
                return BadRequest(new {message = "Cannot delete company with active jobs" });

            return Ok(new { message = "Detele success" });
        }

        // GET: api/companies/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchCompanies(
            [FromQuery] string? keyword,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _companyRepository.SearchCompaniesAsync(keyword, page, pageSize);
            return Ok(result);
        }

        // GET: api/companies/{id}/jobs
        [HttpGet("{id}/jobs")]
        public async Task<IActionResult> GetCompanyJobs(int id)
        {
            var company = await _companyRepository.GetCompanyEntityByIdAsync(id);
            if (company == null)
                return NotFound(new { message = "Company not found" });

            var jobs = await _jobRepository.GetJobsByCompanyAsync(id);
            return Ok(jobs);
        }
    }
}