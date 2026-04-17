using JobSeekingAPI.DTOs;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface ILocationRepository : IBaseRepository<Location>
    {
        Task<IEnumerable<LocationSummaryDTO>> GetAllLocationsSummaryAsync();

        Task<LocationDetailDTO?> GetLocationDetailByIdAsync(int id);

        Task<Location?> GetLocationEntityByIdAsync(int id);
    }
}