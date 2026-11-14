using JobSeekingAPI.DTOs;
using JobSeekingAPI.Enums;
using JobSeekingAPI.Repositories;

namespace JobSeekingAPI.Services
{
    /// <summary>
    /// Tổng hợp số liệu thống kê, biểu đồ thị trường lao động và dữ liệu đồ thị kỹ năng
    /// </summary>
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepo;

        public ReportService(IReportRepository reportRepo)
        {
            _reportRepo = reportRepo;
        }

        /// <summary>
        /// Thống kê top kỹ năng được tuyển dụng nhiều nhất kèm tỷ trọng phần trăm
        /// </summary>
        public async Task<List<MarketTrendDTO>> GetMarketTrendAsync(int limit)
        {
            var totalJobs = await _reportRepo.GetTotalJobsCountAsync();
            if (totalJobs == 0) return new List<MarketTrendDTO>();

            var rawTags = await _reportRepo.GetTopTagJobCountsAsync(limit);

            return rawTags.Select(t => new MarketTrendDTO(
                t.TagName,
                t.JobCount,
                totalJobs > 0 ? Math.Round((double)t.JobCount / totalJobs * 100, 2) : 0
            )).ToList();
        }

        /// <summary>
        /// Thống kê mức lương tối thiểu và tối đa trung bình theo từng địa điểm
        /// </summary>
        public async Task<List<SalaryReportDTO>> GetSalaryByLocationAsync()
        {
            var rawSalaries = await _reportRepo.GetRawSalaryByLocationAsync();

            return rawSalaries
                .Select(g => new SalaryReportDTO(
                    g.LocationName,
                    Math.Round(g.AvgMin ?? 0, 0),
                    Math.Round(g.AvgMax ?? 0, 0),
                    g.JobCount
                ))
                .OrderByDescending(x => x.AverageMaxSalary)
                .ToList();
        }

        /// <summary>
        /// Lấy danh sách các doanh nghiệp tuyển dụng tích cực nhất dựa trên số tin đăng
        /// </summary>
        public async Task<List<TopCompanyDTO>> GetTopCompaniesAsync(int limit)
        {
            var rawCompanies = await _reportRepo.GetRawTopCompaniesAsync(limit);

            return rawCompanies.Select(c => new TopCompanyDTO(
                c.CompanyId,
                c.CompanyName,
                c.LogoImg,
                c.JobCount,
                c.AppCount,
                c.ViewCount ?? 0,
                c.AvgSalary ?? 0,
                c.LatestJobDate
            )).ToList();
        }

        /// <summary>
        /// Xây dựng đồ thị đồng xuất hiện của các kỹ năng trong tin tuyển dụng
        /// </summary>
        public async Task<SkillsGraphResultDTO> GetSkillsGraphAsync(int nodeLimit)
        {
            var rawNodes = await _reportRepo.GetRawGraphNodesAsync(nodeLimit);

            var nodes = rawNodes.Select(t => new GraphNodeDTO(
                t.TagId,
                t.TagName,
                t.Type ?? "Skill",
                t.Size,
                (double)(t.CurrentAvgSalary ?? 0),
                t.JobCount
            )).ToList();

            var nodeIds = nodes.Select(n => n.Id).ToList();

            if (!nodeIds.Any())
            {
                return new SkillsGraphResultDTO(new List<GraphNodeDTO>(), new List<GraphEdgeDTO>());
            }

            var jobSkillGroups = await _reportRepo.GetJobSkillGroupsAsync(nodeIds);
            var edgeCounts = new Dictionary<(int, int), int>();

            foreach (var tagIds in jobSkillGroups)
            {
                for (int i = 0; i < tagIds.Count; i++)
                {
                    for (int j = i + 1; j < tagIds.Count; j++)
                    {
                        var a = tagIds[i];
                        var b = tagIds[j];
                        var key = a < b ? (a, b) : (b, a);

                        if (edgeCounts.ContainsKey(key))
                            edgeCounts[key]++;
                        else
                            edgeCounts[key] = 1;
                    }
                }
            }

            var totalActiveJobs = jobSkillGroups.Count;

            var edges = edgeCounts
                .Select(x => new GraphEdgeDTO(
                    x.Key.Item1,
                    x.Key.Item2,
                    x.Value,
                    totalActiveJobs > 0
                        ? Math.Round((double)x.Value / totalActiveJobs * 100, 2)
                        : 0
                ))
                .OrderByDescending(e => e.Value)
                .Take(100)
                .ToList();

            return new SkillsGraphResultDTO(nodes, edges);
        }

        /// <summary>
        /// Tổng hợp toàn bộ số liệu cho trang Dashboard quản trị và thị trường
        /// </summary>
        public async Task<DashboardSummaryDTO> GetDashboardSummaryAsync()
        {
            var now = DateTime.UtcNow;
            var snap = await _reportRepo.GetDashboardSnapshotAsync(now);

            int rangeUnder10 = 0, range10To20 = 0, range20To30 = 0, range30To50 = 0, rangeOver50 = 0, negotiable = 0;

            foreach (var s in snap.ActiveJobSalaries)
            {
                decimal min = s.SalaryMin ?? 0;
                decimal max = s.SalaryMax ?? 0;

                if (min == 0 && max == 0) { negotiable++; continue; }

                decimal referenceSalary = 0;
                if (min > 0 && max > 0) referenceSalary = (min + max) / 2;
                else if (min == 0 && max > 0) referenceSalary = max;
                else if (min > 0 && max == 0) referenceSalary = min;

                if (referenceSalary < 10) rangeUnder10++;
                else if (referenceSalary >= 10 && referenceSalary < 20) range10To20++;
                else if (referenceSalary >= 20 && referenceSalary < 30) range20To30++;
                else if (referenceSalary >= 30 && referenceSalary <= 50) range30To50++;
                else if (referenceSalary > 50) rangeOver50++;
            }

            var salaryChartData = new List<SimpleStatDTO>
            {
                new SimpleStatDTO { Label = "Lương thỏa thuận", Value = negotiable },
                new SimpleStatDTO { Label = "Dưới 10 Triệu", Value = rangeUnder10 },
                new SimpleStatDTO { Label = "10 - 20 Triệu", Value = range10To20 },
                new SimpleStatDTO { Label = "20 - 30 Triệu", Value = range20To30 },
                new SimpleStatDTO { Label = "30 - 50 Triệu", Value = range30To50 },
                new SimpleStatDTO { Label = "Trên 50 Triệu", Value = rangeOver50 }
            };

            var jobByDept = await GetJobDistributionByLevelAsync();
            var hiringTrends = await GetHiringTrendsAndForecastAsync();

            return new DashboardSummaryDTO
            {
                Overview = new DashboardOverviewStatsDTO
                {
                    TotalJobs = snap.TotalJobs,
                    TotalCandidates = snap.TotalCandidates,
                    TotalCompanies = snap.TotalCompanies,
                    TotalRecruiters = snap.TotalRecruiters,
                    TotalActiveHiringCompanies = snap.ActiveHiringCompanies,
                    TotalActiveIndustries = snap.ActiveIndustries,
                    ApplicationRate = snap.TotalJobs > 0 ? Math.Round((double)snap.TotalCandidates / snap.TotalJobs, 2) : 0
                },
                Charts = new DashboardChartsDTO
                {
                    SalaryRanges = salaryChartData,
                    JobByDept = jobByDept,
                    HiringTrends = hiringTrends
                },
                FormsAndStatus = new DashboardFormsAndStatusDTO
                {
                    Applications = new ApplicationStatsDTO(
                        snap.TotalApplications,
                        snap.AppsLast7Days,
                        snap.AppsLastMonth,
                        snap.AppsThisYear
                    ),
                    JobsByStatus = new JobStatusStatsDTO(
                        snap.ActiveJobsCount,
                        snap.ExpiredJobsCount,
                        snap.TotalJobs
                    )
                },
                LastUpdated = now
            };
        }

        /// <summary>
        /// Thống kê tỷ lệ phân bố công việc theo cấp bậc (Level)
        /// </summary>
        public async Task<List<SimpleStatDTO>> GetJobDistributionByLevelAsync()
        {
            return await _reportRepo.GetJobDistributionByLevelAsync();
        }

        /// <summary>
        /// Thống kê xu hướng số lượng tin đăng qua từng năm và dự báo cho năm kế tiếp
        /// </summary>
        public async Task<List<TrendStatDTO>> GetHiringTrendsAndForecastAsync()
        {
            var history = await _reportRepo.GetYearlyJobCountsAsync();

            var trends = history.Select(h => new TrendStatDTO
            {
                Period = h.Year.ToString(),
                Actual = h.Count,
                Forecast = 0
            }).ToList();

            if (history.Count >= 2)
            {
                var last = history.Last();
                var prev = history[history.Count - 2];

                double growth = prev.Count > 0 ? (double)last.Count / prev.Count : 1.1;

                trends.Add(new TrendStatDTO
                {
                    Period = (last.Year + 1).ToString() + " (Dự báo)",
                    Actual = 0,
                    Forecast = (int)(last.Count * growth)
                });
            }
            return trends;
        }

        /// <summary>
        /// Thống kê số lượng đơn ứng tuyển theo chu kỳ thời gian (day, week, month, year)
        /// </summary>
        public async Task<object> GetApplicationTimelineAsync(string period, int months)
        {
            var endDate = DateTime.UtcNow;
            var startDate = period.ToLower() switch
            {
                "day" => endDate.AddDays(-30),
                "week" => endDate.AddDays(-90),
                "month" => endDate.AddMonths(-months),
                "year" => endDate.AddYears(-3),
                _ => endDate.AddMonths(-6)
            };

            var rawApps = await _reportRepo.GetApplicationsAppliedSinceAsync(startDate);
            var rawData = rawApps.Select(a => new
            {
                a.AppliedDate,
                a.Status,
                Year = a.AppliedDate.Year,
                Month = a.AppliedDate.Month,
                Week = (a.AppliedDate - startDate).Days / 7,
                Day = a.AppliedDate.Date
            }).ToList();

            if (!rawData.Any())
            {
                return new
                {
                    Period = period,
                    StartDate = startDate,
                    EndDate = endDate,
                    Data = new List<object>(),
                    Total = 0
                };
            }

            var groupedData = rawData
                .GroupBy(a => new { a.Year, a.Month, a.Week, a.Day })
                .Select(g => new
                {
                    Period = period.ToLower() switch
                    {
                        "day" => g.Key.Day.ToString("yyyy-MM-dd"),
                        "week" => $"Week {g.Key.Week}",
                        "month" => $"{g.Key.Year}-{g.Key.Month:D2}",
                        "year" => g.Key.Year.ToString(),
                        _ => $"{g.Key.Year}-{g.Key.Month:D2}"
                    },
                    Total = g.Count(),
                    ByStatus = new
                    {
                        Pending = g.Count(a => a.Status == (int)ApplicationStatus.Pending),
                        Reviewed = g.Count(a => a.Status == (int)ApplicationStatus.Reviewed),
                        Interviewing = g.Count(a => a.Status == (int)ApplicationStatus.Interviewing),
                        Accepted = g.Count(a => a.Status == (int)ApplicationStatus.Accepted),
                        Rejected = g.Count(a => a.Status == (int)ApplicationStatus.Rejected)
                    }
                })
                .OrderBy(x => x.Period)
                .ToList();

            return new
            {
                Period = period,
                StartDate = startDate,
                EndDate = endDate,
                Data = groupedData,
                Total = groupedData.Sum(x => x.Total),
                Summary = new
                {
                    TotalApplications = groupedData.Sum(x => x.Total),
                    ByStatus = new
                    {
                        Pending = groupedData.Sum(x => x.ByStatus.Pending),
                        Reviewed = groupedData.Sum(x => x.ByStatus.Reviewed),
                        Interviewing = groupedData.Sum(x => x.ByStatus.Interviewing),
                        Accepted = groupedData.Sum(x => x.ByStatus.Accepted),
                        Rejected = groupedData.Sum(x => x.ByStatus.Rejected)
                    }
                }
            };
        }
    }
}
