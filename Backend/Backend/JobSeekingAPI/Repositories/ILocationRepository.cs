using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ILocationRepository : IBaseRepository<Location>
    {
        Task<IEnumerable<LocationSummaryDTO>> GetAllLocationsSummaryAsync();
        Task<LocationDetailDTO?> GetLocationDetailByIdAsync(int id);
        Task<Location?> GetLocationEntityByIdAsync(int id);

        Task<IEnumerable<LocationSummaryDTO>> SearchLocationsAsync(string keyword);
        Task<IEnumerable<LocationSummaryDTO>> GetPopularLocationsAsync(int limit);
        Task<PagedResultDTO<JobDetailDTO>> GetJobsByLocationAsync(int locationId, int page, int pageSize);
    }
}