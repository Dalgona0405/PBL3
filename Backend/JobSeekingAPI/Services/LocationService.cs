using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Models;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepo;

        public LocationService(ILocationRepository locationRepo)
        {
            _locationRepo = locationRepo;
        }

        public async Task<IEnumerable<LocationSummaryDTO>> GetAllLocationsAsync()
        {
            return await _locationRepo.GetAllLocationsSummaryAsync();
        }

        public async Task<LocationDetailDTO> GetLocationByIdAsync(int id)
        {
            var location = await _locationRepo.GetLocationDetailByIdAsync(id);
            if (location == null)
                throw new KeyNotFoundException("Không tìm thấy địa điểm.");
            return location;
        }

        public async Task<LocationSummaryDTO> CreateLocationAsync(CreateLocationDTO dto)
        {
            var location = new Location
            {
                LocationName = dto.LocationName
            };

            var createdLocation = await _locationRepo.CreateAsync(location);
            return createdLocation.ToSummaryDto();
        }

        public async Task UpdateLocationAsync(int id, UpdateLocationDTO dto)
        {
            var location = await _locationRepo.GetLocationEntityByIdAsync(id);
            if (location == null)
                throw new KeyNotFoundException("Không tìm thấy địa điểm.");

            location.LocationName = dto.LocationName ?? location.LocationName;
            await _locationRepo.UpdateAsync(location);
        }

        public async Task DeleteLocationAsync(int id)
        {
            var location = await _locationRepo.GetLocationEntityByIdAsync(id);
            if (location == null)
                throw new KeyNotFoundException("Không tìm thấy địa điểm.");

            var detail = await _locationRepo.GetLocationDetailByIdAsync(id);
            if (detail != null && detail.JobCount > 0)
            {
                throw new ArgumentException("Không thể xóa địa điểm đang có tin tuyển dụng hoạt động.");
            }

            await _locationRepo.DeleteAsync(id);
        }

        public async Task<IEnumerable<LocationSummaryDTO>> SearchLocationsAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                throw new ArgumentException("Vui lòng nhập từ khóa tìm kiếm địa điểm.");

            return await _locationRepo.SearchLocationsAsync(keyword);
        }

        public async Task<IEnumerable<LocationSummaryDTO>> GetPopularLocationsAsync(int limit)
        {
            return await _locationRepo.GetPopularLocationsAsync(limit);
        }

        public async Task<(string locationName, PagedResultDTO<JobDetailDTO> result)> GetJobsByLocationAsync(int id, int page, int pageSize)
        {
            var location = await _locationRepo.GetLocationEntityByIdAsync(id);
            if (location == null)
                throw new KeyNotFoundException("Không tìm thấy địa điểm.");

            var result = await _locationRepo.GetJobsByLocationAsync(id, page, pageSize);
            return (location.LocationName, result);
        }
    }
}
