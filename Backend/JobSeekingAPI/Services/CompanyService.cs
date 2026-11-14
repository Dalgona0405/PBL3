using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ICompanyRepository _companyRepo;

        public CompanyService(ICompanyRepository companyRepo)
        {
            _companyRepo = companyRepo;
        }

        public async Task<IEnumerable<CompanySummaryDTO>> GetAllCompaniesAsync()
        {
            return await _companyRepo.GetAllCompaniesSummaryAsync();
        }

        public async Task<CompanyDetailDTO> GetCompanyByIdAsync(int id)
        {
            var company = await _companyRepo.GetCompanyDetailByIdAsync(id);
            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");
            return company;
        }

        public async Task<int> GetCompanyIdByRecruiterIdAsync(int recruiterId, int currentUserId, bool isRecruiterRole)
        {
            if (isRecruiterRole && currentUserId != recruiterId)
                throw new ForbiddenAccessException("Bạn không có quyền truy cập thông tin doanh nghiệp này.");

            var companyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(recruiterId);
            if (companyId == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp của nhà tuyển dụng này.");

            return companyId.Value;
        }

        public async Task<Company> CreateCompanyAsync(CreateCompanyDTO dto)
        {
            var company = new Company
            {
                CompanyName = dto.CompanyName,
                LogoImg = dto.LogoImg,
                Website = dto.Website,
                Size = dto.Size,
                TaxCode = dto.TaxCode
            };
            await _companyRepo.CreateAsync(company);
            return company;
        }

        public async Task UpdateCompanyAsync(int id, UpdateCompanyDTO dto, int currentUserId)
        {
            var recruiterCompanyId = await _companyRepo.GetCompanyIdByRecruiterIdAsync(currentUserId);
            if (recruiterCompanyId == null || recruiterCompanyId != id)
                throw new ForbiddenAccessException("Bạn không có quyền truy cập hoặc chỉnh sửa doanh nghiệp này.");

            var existingCompany = await _companyRepo.GetCompanyEntityByIdAsync(id);
            if (existingCompany == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");

            existingCompany.CompanyName = dto.CompanyName ?? existingCompany.CompanyName;
            existingCompany.LogoImg = dto.LogoImg ?? existingCompany.LogoImg;
            existingCompany.Website = dto.Website ?? existingCompany.Website;
            existingCompany.Size = dto.Size ?? existingCompany.Size;
            existingCompany.TaxCode = dto.TaxCode ?? existingCompany.TaxCode;

            await _companyRepo.UpdateAsync(existingCompany);
        }

        public async Task DeleteCompanyAsync(int id)
        {
            await _companyRepo.SoftDeleteCompanyAsync(id);
        }

        public async Task<PagedResultDTO<CompanySummaryDTO>> SearchCompaniesAsync(string? keyword, int page, int pageSize)
        {
            return await _companyRepo.SearchCompaniesAsync(keyword, page, pageSize);
        }

        public async Task<(string message, int companyId, bool isVerified, DateTime? verifiedAt)> VerifyCompanyBadgeAsync(int id, bool isVerified)
        {
            var company = await _companyRepo.GetCompanyEntityByIdAsync(id);
            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");

            company.IsVerified = isVerified;
            company.VerifiedAt = isVerified ? DateTime.UtcNow : null;

            await _companyRepo.UpdateAsync(company);

            string message = isVerified
                ? $"Đã cấp Tick Xanh xác thực cho doanh nghiệp '{company.CompanyName}'."
                : $"Đã thu hồi Tick Xanh của doanh nghiệp '{company.CompanyName}'.";

            return (message, company.CompanyId, company.IsVerified, company.VerifiedAt);
        }
    }
}
