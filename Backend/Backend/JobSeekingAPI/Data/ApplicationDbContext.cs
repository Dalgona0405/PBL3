using Microsoft.EntityFrameworkCore;
using JobSeekingAPI.Models;

namespace JobSeekingAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<Recruiter> Recruiters { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<JobTag> JobTags { get; set; }
        public DbSet<CandidateTag> CandidateTags { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<Experience> Experiences { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =================================================================
            // 1. USERS
            // =================================================================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                
                entity.HasIndex(u => u.Email)
                    .IsUnique()
                    .HasDatabaseName("IX_Users_Email_Unique");

                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(u => u.Password)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(u => u.Role)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(u => u.LastLogin);

                entity.HasQueryFilter(u => u.DeletedAt == null);
            });

            // =================================================================
            // 2. COMPANIES
            // =================================================================
            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(c => c.CompanyId);
                
                entity.Property(c => c.CompanyName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(c => c.LogoImg)
                    .HasMaxLength(500);

                entity.Property(c => c.Website)
                    .HasMaxLength(255);

                entity.Property(c => c.Size)
                    .HasMaxLength(100);

                entity.HasQueryFilter(c => c.DeletedAt == null);
            });

            // =================================================================
            // 3. LOCATIONS
            // =================================================================
            modelBuilder.Entity<Location>(entity =>
            {
                entity.HasKey(l => l.LocationId);
                
                entity.Property(l => l.LocationName)
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // =================================================================
            // 4. TAGS
            // =================================================================
            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(t => t.TagId);
                
                entity.Property(t => t.TagName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(t => t.Type)
                    .HasMaxLength(50);

                entity.HasIndex(t => t.TagName)
                    .IsUnique()
                    .HasDatabaseName("IX_Tags_TagName_Unique");
            });

            // =================================================================
            // 5. CANDIDATES
            // =================================================================
            modelBuilder.Entity<Candidate>(entity =>
            {
                entity.HasKey(c => c.UserId);

                entity.HasOne(c => c.User)
                    .WithOne(u => u.Candidate)
                    .HasForeignKey<Candidate>(c => c.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.FullName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(c => c.Gender)
                    .HasMaxLength(10);

                entity.Property(c => c.Phone)
                    .HasMaxLength(20);

                entity.Property(c => c.Address)
                    .HasMaxLength(500);

                entity.Property(c => c.CVUrl)
                    .HasMaxLength(500);

                entity.HasQueryFilter(c => c.User != null && c.User.DeletedAt == null);
            });

            // =================================================================
            // 6. RECRUITERS
            // =================================================================
            modelBuilder.Entity<Recruiter>(entity =>
            {
                entity.HasKey(r => r.UserId);

                entity.HasOne(r => r.User)
                    .WithOne(u => u.Recruiter)
                    .HasForeignKey<Recruiter>(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Company)
                    .WithMany(c => c.Recruiters)
                    .HasForeignKey(r => r.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(r => r.Position)
                    .HasMaxLength(100);

                entity.HasQueryFilter(r => r.User != null && r.User.DeletedAt == null);
            });

            // =================================================================
            // 7. JOBS
            // =================================================================
            modelBuilder.Entity<Job>(entity =>
            {
                entity.HasKey(j => j.JobId);

                entity.HasOne(j => j.Company)
                    .WithMany(c => c.Jobs)
                    .HasForeignKey(j => j.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(j => j.Location)
                    .WithMany(l => l.Jobs)
                    .HasForeignKey(j => j.LocationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(j => j.SalaryMin)
                    .HasPrecision(18, 2);

                entity.Property(j => j.SalaryMax)
                    .HasPrecision(18, 2);

                entity.Property(j => j.Title)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(j => j.Description)
                    .HasMaxLength(4000);

                entity.Property(j => j.Requirement)
                    .HasMaxLength(4000);

                entity.Property(j => j.Benefits)
                    .HasMaxLength(4000);

                entity.Property(j => j.Level)
                    .HasMaxLength(50);

                entity.Property(j => j.Address)
                    .HasMaxLength(500);

                entity.Property(j => j.ViewCount)
                    .HasDefaultValue(0);

                entity.Property(j => j.PostedDate)
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(j => j.Status)
                    .HasDefaultValue(1);

                entity.HasQueryFilter(j => j.DeletedAt == null);
            });

            // =================================================================
            // 8. JOB TAGS
            // =================================================================
            modelBuilder.Entity<JobTag>(entity =>
            {
                entity.HasKey(jt => new { jt.JobId, jt.TagId });

                entity.HasOne(jt => jt.Job)
                    .WithMany(j => j.JobTags)
                    .HasForeignKey(jt => jt.JobId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(jt => jt.Tag)
                    .WithMany(t => t.JobTags)
                    .HasForeignKey(jt => jt.TagId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(jt => jt.Job != null && jt.Job.DeletedAt == null);
            });

            // =================================================================
            // 9. CANDIDATE TAGS - ĐÃ FIX WARNING
            // =================================================================
            modelBuilder.Entity<CandidateTag>(entity =>
            {
                entity.HasKey(ct => new { ct.UserId, ct.TagId });

                entity.HasOne(ct => ct.Candidate)
                    .WithMany(c => c.CandidateTags)
                    .HasForeignKey(ct => ct.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ct => ct.Tag)
                    .WithMany(t => t.CandidateTags)
                    .HasForeignKey(ct => ct.TagId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(ct => ct.Proficiency)
                    .HasMaxLength(50);

                // ✅ FIX: Thêm filter để khớp với Candidate
                entity.HasQueryFilter(ct => ct.Candidate != null && 
                                           ct.Candidate.User != null && 
                                           ct.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 10. APPLICATIONS - ĐÃ FIX HOÀN TOÀN
            // =================================================================
            modelBuilder.Entity<Application>(entity =>
            {
                entity.HasKey(a => a.AppId);
                
                entity.Property(a => a.AppId)
                    .ValueGeneratedOnAdd();

                // ✅ CHỈ 1 QUAN HỆ - với Candidate
                entity.HasOne(a => a.Candidate)
                    .WithMany(c => c.Applications)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Job)
                    .WithMany(j => j.Applications)
                    .HasForeignKey(a => a.JobId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.AppliedDate)
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(a => a.Status)
                    .HasDefaultValue(1);

                entity.HasIndex(a => new { a.UserId, a.JobId })
                    .IsUnique()
                    .HasDatabaseName("IX_Applications_UserId_JobId_Unique")
                    .HasFilter("DeletedAt IS NULL");

                entity.HasIndex(a => a.Status)
                    .HasDatabaseName("IX_Applications_Status");

                // ✅ FIX: Filter hoàn chỉnh
                entity.HasQueryFilter(a => a.DeletedAt == null && 
                                          a.Candidate != null && 
                                          a.Candidate.User != null && 
                                          a.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 11. EXPERIENCES - ĐÃ FIX WARNING
            // =================================================================
            modelBuilder.Entity<Experience>(entity =>
            {
                entity.HasKey(e => e.ExpId);

                entity.HasOne(e => e.Candidate)
                    .WithMany(c => c.Experiences)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.JobTitle)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.CompanyName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.StartDate)
                    .IsRequired();

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                // ✅ FIX: Thêm filter để khớp với Candidate
                entity.HasQueryFilter(e => e.Candidate != null && 
                                          e.Candidate.User != null && 
                                          e.Candidate.User.DeletedAt == null);
            });
        }
    }
}