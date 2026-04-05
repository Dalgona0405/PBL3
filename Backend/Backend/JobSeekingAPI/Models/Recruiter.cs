using System.ComponentModel.DataAnnotations; 
using System.ComponentModel.DataAnnotations.Schema;  
namespace JobSeekingAPI.Models;
public class Recruiter
{
    [Key, ForeignKey("User")]
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;
    // public string? Avatar { get; set; }
    [NotMapped] // Dòng này cực kỳ quan trọng: Nó bảo EF đừng tìm cột Avatar ở bảng Recruiter
    public string? Avatar 
    { 
        get => User?.Avatar; 
        set { if (User != null) User.Avatar = value; } 
    }

    public int CompanyId { get; set; }
    
    // ✅ SỬA: string? thay vì string (cho phép null)
    public string? Position { get; set; } 
    
    public User? User { get; set; }
    public Company? Company { get; set; }
}