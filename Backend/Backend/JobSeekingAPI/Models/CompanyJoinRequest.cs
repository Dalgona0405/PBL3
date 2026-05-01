using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobSeekingAPI.Models
{
    public class CompanyJoinRequest
    {
        [Key]
        public int RequestId { get; set; }

        public int UserId { get; set; } // ID của Recruiter
        public int CompanyId { get; set; } // ID của Công ty muốn vào

        // Status: 0 = Pending (Chờ duyệt), 1 = Approved (Đã duyệt), 2 = Rejected (Từ chối)
        public int Status { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public Recruiter? Recruiter { get; set; }

        [ForeignKey("CompanyId")]
        public Company? Company { get; set; }
    }
}