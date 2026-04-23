using System;
using System.Collections.Generic;

namespace JobSeekingAPI.DTOs
{
    // ==========================================
    // CÁC CLASS CƠ BẢN DÙNG CHUNG
    // ==========================================
    
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

    // ==========================================
    // CÁC CLASS NHÓM DỮ LIỆU ĐỂ TÁCH BIỆT RÕ RÀNG
    // ==========================================

    // 1. Nhóm Thống Kê Tổng Quan (Overview)
    public class DashboardOverviewStatsDTO
    {
        public int TotalJobs { get; set; }
        public int TotalCandidates { get; set; }
        public int TotalCompanies { get; set; }
        public int TotalRecruiters { get; set; }

        // Tống số thống kê dạng đang tuyển dụng
        public int TotalActiveHiringCompanies { get; set; } 
        public int TotalActiveIndustries { get; set; } 
        public double ApplicationRate { get; set; }
    }

    // 2. Nhóm Dành Riêng Cho Biểu Đồ (Charts)
    public class DashboardChartsDTO
    {
        public List<SimpleStatDTO> SalaryRanges { get; set; } = new();
        public List<SimpleStatDTO> JobByDept { get; set; } = new();
        public List<TrendStatDTO> HiringTrends { get; set; } = new();
        
        // Các danh sách phục vụ vẽ BIỂU ĐỒ bổ sung (Dự báo, xu hướng, kỹ năng)
        public List<SimpleStatDTO> SkillDistribution { get; set; } = new();
        public List<TrendStatDTO> GrowthTrends { get; set; } = new();
        public List<SimpleStatDTO> DeptStats { get; set; } = new();
        public List<SimpleStatDTO> TopSkills { get; set; } = new();
    }

    // 3. Nhóm Forms & Trạng thái (Status, Applications...)
    public class DashboardFormsAndStatusDTO
    {
        public ApplicationStatsDTO Applications { get; set; } = new(); 
        public JobStatusStatsDTO JobsByStatus { get; set; } = new();
    }

    // ==========================================
    // CLASS CHÍNH TRẢ VỀ API (Gói 3 nhóm trên lại)
    // ==========================================
    public class DashboardSummaryDTO
    {
        public DashboardOverviewStatsDTO Overview { get; set; } = new();
        public DashboardChartsDTO Charts { get; set; } = new();
        public DashboardFormsAndStatusDTO FormsAndStatus { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }
}