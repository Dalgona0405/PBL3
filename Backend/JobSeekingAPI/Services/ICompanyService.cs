using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Services
{
    public interface ICompanyService
    {
        Task<IEnumerable<CompanySummaryDTO>> GetAllCompaniesAsync();
        Task<CompanyDetailDTO> GetCompanyByIdAsync(int id);
        Task<int> GetCompanyIdByRecruiterIdAsync(int recruiterId, int currentUserId, bool isRecruiterRole);
        Task<Company> CreateCompanyAsync(CreateCompanyDTO dto);
        Task UpdateCompanyAsync(int id, UpdateCompanyDTO dto, int currentUserId);
        Task DeleteCompanyAsync(int id);
        Task<PagedResultDTO<CompanySummaryDTO>> SearchCompaniesAsync(string? keyword, int page, int pageSize);
        Task<(string message, int companyId, bool isVerified, DateTime? verifiedAt)> VerifyCompanyBadgeAsync(int id, bool isVerified);
    }
}
