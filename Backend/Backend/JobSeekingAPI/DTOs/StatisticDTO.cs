using System;
using System.Collections.Generic;

namespace JobSeekingAPI.DTOs
{
    // 1. Dùng cho biểu đồ Tròn (Pie) hoặc Cột (Bar)
    public class SimpleStatDTO
    {
        public string Label { get; set; } = string.Empty;
        public double Value { get; set; }
    }

    // 2. Dùng cho biểu đồ Đường (Line)
    public class TrendStatDTO
    {
        public string Period { get; set; } = string.Empty; 
        public int Actual { get; set; }
        public int Forecast { get; set; }
    }

    // 3. DTO hỗ trợ cho các Class con trong Dashboard
    public class ApplicationStatsDTO
    {
        public int Total { get; set; }
        public int NewLast7Days { get; set; }
        public int NewLastMonth { get; set; }
        public int NewThisYear { get; set; }

        public ApplicationStatsDTO() { }
        public ApplicationStatsDTO(int total, int last7, int lastMonth, int lastYear)
        {
            Total = total; NewLast7Days = last7; NewLastMonth = lastMonth; NewThisYear = lastYear;
        }
    }

    public class JobStatusStatsDTO
    {
        public int Active { get; set; }
        public int Expired { get; set; }
        public int Total { get; set; }

        public JobStatusStatsDTO() { }
        public JobStatusStatsDTO(int active, int expired, int total)
        {
            Active = active; Expired = expired; Total = total;
        }
    }

    // 4. Tổng hợp Dashboard (Hợp nhất các thuộc tính bạn đang gọi)
    public class DashboardSummaryDTO
    {
        // Các trường số lượng tổng quát (ReportService đang gọi)
        public int TotalJobs { get; set; }
        public int TotalCandidates { get; set; }
        public int TotalCompanies { get; set; }
        public int TotalRecruiters { get; set; }
        // Các Class thống kê chi tiết
        public ApplicationStatsDTO Applications { get; set; } = new();
        public JobStatusStatsDTO JobsByStatus { get; set; } = new();
        public double ApplicationRate { get; set; }
        
        // Các danh sách phục vụ vẽ BIỂU ĐỒ (Dự báo, xu hướng)
        public List<SimpleStatDTO> JobByDept { get; set; } = new();
        public List<TrendStatDTO> HiringTrends { get; set; } = new();
        public List<SimpleStatDTO> SkillDistribution { get; set; } = new();
        public List<TrendStatDTO> GrowthTrends { get; set; } = new();
        public List<SimpleStatDTO> DeptStats { get; set; } = new();
        public List<SimpleStatDTO> TopSkills { get; set; } = new();

        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}