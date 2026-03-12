using JobSeekingAPI.DTOs;

namespace JobSeekingAPI.Services
{
    public interface IReportService
    {
        // Lấy xu hướng thị trường kỹ năng
        Task<List<MarketTrendDTO>> GetMarketTrendAsync(int limit);
        
        // Lấy báo cáo lương theo địa điểm
        Task<List<SalaryReportDTO>> GetSalaryByLocationAsync();
        
        // Xử lý logic Graph AI (Nodes & Edges) cho kỹ năng liên quan
        Task<object> GetSkillsGraphAsync(int nodeLimit);
        
        // Tổng hợp số liệu Dashboard nhanh cho Admin
        Task<DashboardSummaryDTO> GetDashboardSummaryAsync();
        
        // Thống kê doanh nghiệp hàng đầu (Dữ liệu cho Frontend)
        Task<List<TopCompanyDTO>> GetTopCompaniesAsync(int limit);
    }
}