using System.ComponentModel.DataAnnotations; 
using System.ComponentModel.DataAnnotations.Schema;  
namespace JobSeekingAPI.Models;
public class Recruiter
{
    [Key, ForeignKey("User")]
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string? Avatar { get; set; }

    public int CompanyId { get; set; }
    
    // ✅ SỬA: string? thay vì string (cho phép null)
    public string? Position { get; set; }
    
    public User? User { get; set; }
    public Company? Company { get; set; }
}