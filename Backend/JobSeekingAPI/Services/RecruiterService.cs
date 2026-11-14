using JobSeekingAPI.DTOs;
using JobSeekingAPI.Helpers;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    public class RecruiterService : IRecruiterService
    {
        private readonly IRecruiterRepository _recruiterRepo;
        private readonly ICompanyRepository _companyRepo;

        public RecruiterService(IRecruiterRepository recruiterRepo, ICompanyRepository companyRepo)
        {
            _recruiterRepo = recruiterRepo;
            _companyRepo = companyRepo;
        }

        public async Task<RecruiterDetailDTO> GetRecruiterByIdAsync(int id)
        {
            var recruiter = await _recruiterRepo.GetRecruiterDetailByIdAsync(id);
            if (recruiter == null)
                throw new KeyNotFoundException("Không tìm thấy thông tin nhà tuyển dụng.");
            return recruiter.ToDetailDto();
        }

        public async Task<IEnumerable<RecruiterSummaryDTO>> GetRecruitersByCompanyAsync(int companyId)
        {
            var companyExists = await _companyRepo.GetByIdAsync(companyId);
            if (companyExists == null)
                throw new KeyNotFoundException("Không tìm thấy doanh nghiệp.");

            var recruiters = await _recruiterRepo.GetRecruitersByCompanyAsync(companyId);
            return recruiters.Select(r => r.ToSummaryDto());
        }

        public async Task<string> UpdateRecruiterAsync(int id, UpdateRecruiterDTO dto, int currentUserId, bool isCompanyRole)
        {
            var existingRecruiter = await _recruiterRepo.GetRecruiterEntityByIdAsync(id);
            if (existingRecruiter == null)
                throw new KeyNotFoundException("Không tìm thấy thông tin nhà tuyển dụng.");

            if (id != currentUserId)
            {
                if (!isCompanyRole)
                    throw new ForbiddenAccessException("Bạn không có quyền chỉnh sửa hồ sơ của người khác.");

                var ownerProfile = await _recruiterRepo.GetRecruiterEntityByIdAsync(currentUserId);
                if (ownerProfile?.CompanyId == null || existingRecruiter.CompanyId != ownerProfile.CompanyId)
                    throw new ForbiddenAccessException("Nhân sự này không thuộc doanh nghiệp của bạn.");

                existingRecruiter.CompanyId = dto.CompanyId;
                await _recruiterRepo.UpdateAsync(existingRecruiter);
                return "Đã cập nhật trạng thái nhân sự trong doanh nghiệp.";
            }

            if (existingRecruiter.User != null)
            {
                existingRecruiter.User.FullName = dto.FullName ?? existingRecruiter.User.FullName;
                existingRecruiter.User.Avatar = dto.Avatar ?? existingRecruiter.User.Avatar;
            }

            // Không cho phép Recruiter tự đổi CompanyId qua endpoint cập nhật hồ sơ cá nhân
            existingRecruiter.Position = dto.Position ?? existingRecruiter.Position;

            await _recruiterRepo.UpdateAsync(existingRecruiter);
            return "Cập nhật hồ sơ nhà tuyển dụng thành công.";
        }
    }
}
