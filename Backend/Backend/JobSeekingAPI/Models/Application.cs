using System;
using System.ComponentModel.DataAnnotations;

namespace JobSeekingAPI.Models
{
    public class Application
    {
        [Key]
        //ĐỔI TÊN: ApplicationId -> AppId cho khớp với SQL
        public int AppId { get; set; }

        public int UserId { get; set; }            // FK trỏ về Candidate
        public int JobId { get; set; }             // FK trỏ về Job

        public DateTime AppliedDate { get; set; }
        public int Status { get; set; }

        // THÊM MỚI: Cột CVUrl đã trở lại!
        // Dùng string? (có dấu ?) vì đôi khi ứng viên xài CV trên profile luôn, không upload link mới
        public string? CVUrl { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public Candidate? Candidate { get; set; }
        public Job? Job { get; set; }
    }
}