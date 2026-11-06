using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ICompanyRepository : IBaseRepository<Company>
    {
        Task<IEnumerable<CompanySummaryDTO>> GetAllCompaniesSummaryAsync();
        Task<CompanyDetailDTO?> GetCompanyDetailByIdAsync(int id);
        Task<PagedResultDTO<CompanySummaryDTO>> SearchCompaniesAsync(string? keyword, int page, int pageSize);
        Task<Company?> GetCompanyEntityByIdAsync(int id);
        Task<string> SoftDeleteCompanyAsync(int id);
        Task<int?> GetCompanyIdByRecruiterIdAsync(int recruiterId);
    }
}