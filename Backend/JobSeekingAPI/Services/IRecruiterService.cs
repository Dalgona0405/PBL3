using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IRecruiterService
    {
        Task<RecruiterDetailDTO> GetRecruiterByIdAsync(int id);
        Task<IEnumerable<RecruiterSummaryDTO>> GetRecruitersByCompanyAsync(int companyId);
        Task<string> UpdateRecruiterAsync(int id, UpdateRecruiterDTO dto, int currentUserId, bool isCompanyRole);
    }
}
