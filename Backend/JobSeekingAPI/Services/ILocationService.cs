using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface ILocationService
    {
        Task<IEnumerable<LocationSummaryDTO>> GetAllLocationsAsync();
        Task<LocationDetailDTO> GetLocationByIdAsync(int id);
        Task<LocationSummaryDTO> CreateLocationAsync(CreateLocationDTO dto);
        Task UpdateLocationAsync(int id, UpdateLocationDTO dto);
        Task DeleteLocationAsync(int id);
        Task<IEnumerable<LocationSummaryDTO>> SearchLocationsAsync(string keyword);
        Task<IEnumerable<LocationSummaryDTO>> GetPopularLocationsAsync(int limit);
        Task<(string locationName, PagedResultDTO<JobDetailDTO> result)> GetJobsByLocationAsync(int id, int page, int pageSize);
    }
}
