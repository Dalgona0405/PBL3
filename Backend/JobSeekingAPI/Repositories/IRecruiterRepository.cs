using JobSeekingAPI.Models;

namespace JobSeekingAPI.Repositories
{
    public interface IRecruiterRepository : IBaseRepository<Recruiter>
    {
        // CRUD ĐẶC THÙ
        //Task<IEnumerable<Recruiter>> GetAllRecruitersWithDetailsAsync();
        Task<Recruiter?> GetRecruiterDetailByIdAsync(int id);
        Task<Recruiter?> GetRecruiterEntityByIdAsync(int id);

        // ===== LỌC THEO QUAN HỆ =====
        Task<IEnumerable<Recruiter>> GetRecruitersByCompanyAsync(int companyId);
    }
}