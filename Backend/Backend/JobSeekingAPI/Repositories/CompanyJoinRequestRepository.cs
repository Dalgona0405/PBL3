using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class CompanyJoinRequestRepository : BaseRepository<CompanyJoinRequest>, ICompanyJoinRequestRepository
    {
        public CompanyJoinRequestRepository(ApplicationDbContext context) : base(context) { }

        // Lấy danh sách đang chờ duyệt
        public async Task<IEnumerable<CompanyJoinRequest>> GetPendingRequestsAsync()
        {
            return await _context.CompanyJoinRequests
                .Include(r => r.Recruiter!).ThenInclude(rec => rec.User)
                .Include(r => r.Company)
                .Where(r => r.Status == 0) // 0 là Pending
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CompanyJoinRequest>> GetPendingRequestsByCompanyAsync(int companyId)
        {
            return await _context.CompanyJoinRequests
                .Include(r => r.Recruiter!).ThenInclude(rec => rec.User)
                .Include(r => r.Company)
                .Where(r => r.Status == 0 && r.CompanyId == companyId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // Kiểm tra xem Recruiter này có đang chờ duyệt đơn nào không (Chống spam)
        public async Task<bool> HasPendingRequestAsync(int recruiterId)
        {
            return await _context.CompanyJoinRequests
                .AnyAsync(r => r.UserId == recruiterId && r.Status == 0);
        }
    }
}