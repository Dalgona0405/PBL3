using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

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
        public DbSet<CompanyJoinRequest> CompanyJoinRequests { get; set; }
        public DbSet<SavedJob> SavedJobs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =================================================================
            // 1. USERS
            // =================================================================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                entity.Property(u => u.UserId).UseIdentityColumn(); // IDENTITY

                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Password).IsRequired().HasMaxLength(255);
                entity.Property(u => u.Role).IsRequired();
                entity.Property(u => u.Avatar).HasMaxLength(500);
                entity.Property(u => u.LastLogin);
                entity.Property(u => u.DeletedAt);

                entity.HasQueryFilter(u => u.DeletedAt == null);
            });

            // =================================================================
            // 2. COMPANIES
            // =================================================================
            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(c => c.CompanyId);
                entity.Property(c => c.CompanyId).UseIdentityColumn();

                entity.Property(c => c.CompanyName).IsRequired().HasMaxLength(200);
                entity.Property(c => c.LogoImg).HasMaxLength(500);
                entity.Property(c => c.Website).HasMaxLength(200);
                entity.Property(c => c.Size).HasMaxLength(50);
                entity.Property(c => c.DeletedAt);

                entity.HasQueryFilter(c => c.DeletedAt == null);
            });

            // =================================================================
            // 3. LOCATIONS
            // =================================================================
            modelBuilder.Entity<Location>(entity =>
            {
                entity.HasKey(l => l.LocationId);
                entity.Property(l => l.LocationId).UseIdentityColumn();
                entity.Property(l => l.LocationName).IsRequired().HasMaxLength(100);
            });

            // =================================================================
            // 4. TAGS
            // =================================================================
            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(t => t.TagId);
                entity.Property(t => t.TagId).UseIdentityColumn();
                entity.Property(t => t.TagName).IsRequired().HasMaxLength(50);
                entity.Property(t => t.Type).HasMaxLength(50);
                entity.HasIndex(t => t.TagName).IsUnique();
            });

            // =================================================================
            // 5. CANDIDATES
            // =================================================================
            modelBuilder.Entity<Candidate>(entity =>
            {
                entity.HasKey(c => c.UserId);
                entity.Property(c => c.UserId).ValueGeneratedNever();

                entity.HasOne(c => c.User)
                    .WithOne(u => u.Candidate)
                    .HasForeignKey<Candidate>(c => c.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.Gender).HasMaxLength(10);
                entity.Property(c => c.Birthday);
                entity.Property(c => c.Phone).HasMaxLength(20);
                entity.Property(c => c.Address).HasMaxLength(500);
                entity.Property(c => c.CVUrl).HasMaxLength(500);

                entity.HasQueryFilter(c => c.User != null && c.User.DeletedAt == null);
            });

            // =================================================================
            // 6. RECRUITERS
            // =================================================================
            modelBuilder.Entity<Recruiter>(entity =>
            {
                entity.HasKey(r => r.UserId);
                entity.Property(r => r.UserId).ValueGeneratedNever();

                entity.HasOne(r => r.User)
                    .WithOne(u => u.Recruiter)
                    .HasForeignKey<Recruiter>(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Company)
                    .WithMany(c => c.Recruiters)
                    .HasForeignKey(r => r.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(r => r.Position).HasMaxLength(100);

                entity.HasQueryFilter(r => r.User != null && r.User.DeletedAt == null);
            });

            // =================================================================
            // 7. JOBS
            // =================================================================
            modelBuilder.Entity<Job>(entity =>
            {
                entity.HasKey(j => j.JobId);
                entity.Property(j => j.JobId).UseIdentityColumn();

                entity.HasOne(j => j.Company)
                    .WithMany(c => c.Jobs)
                    .HasForeignKey(j => j.CompanyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(j => j.Location)
                    .WithMany(l => l.Jobs)
                    .HasForeignKey(j => j.LocationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(j => j.OriginalId).HasMaxLength(50);
                entity.Property(j => j.Title).IsRequired().HasMaxLength(200);
                entity.Property(j => j.SalaryMin).HasPrecision(18, 2);
                entity.Property(j => j.SalaryMax).HasPrecision(18, 2);
                entity.Property(j => j.ExpYear);
                entity.Property(j => j.Level).HasMaxLength(50);
                entity.Property(j => j.PostedDate).HasDefaultValueSql("now()");
                entity.Property(j => j.Deadline);
                entity.Property(j => j.Description).HasColumnType("nvarchar(max)");
                entity.Property(j => j.Requirement).HasColumnType("nvarchar(max)");
                entity.Property(j => j.Benefits).HasColumnType("nvarchar(max)");
                entity.Property(j => j.Address).HasMaxLength(500);
                entity.Property(j => j.ViewCount).HasDefaultValue(0);
                entity.Property(j => j.Status).HasDefaultValue(1);
                entity.Property(j => j.DeletedAt);

                entity.HasQueryFilter(j => j.DeletedAt == null); // Không nên filter ở đây vì có thể cần lấy cả Job đã xóa để hiển thị lịch sử ứng tuyển hoặc báo cáo thống kê
            });

            // =================================================================
            // 8. JOB TAGS
            // =================================================================
            modelBuilder.Entity<JobTag>(entity =>
            {
                // Composite key: JobId + TagId
                entity.HasKey(jt => new { jt.JobId, jt.TagId });

                entity.HasOne(jt => jt.Job)
                    .WithMany(j => j.JobTags)
                    .HasForeignKey(jt => jt.JobId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(jt => jt.Tag)
                    .WithMany(t => t.JobTags)
                    .HasForeignKey(jt => jt.TagId)
                    .OnDelete(DeleteBehavior.Restrict);

                // entity.HasQueryFilter(jt => jt.Job != null && jt.Job.DeletedAt == null); // Không nên filter ở đây vì có thể cần lấy cả JobTag của Job đã xóa để hiển thị lịch sử ứng tuyển
            });

            // =================================================================
            // 9. CANDIDATE TAGS
            // =================================================================
            modelBuilder.Entity<CandidateTag>(entity =>
            {
                // Composite key: UserId + TagId
                entity.HasKey(ct => new { ct.UserId, ct.TagId });

                entity.HasOne(ct => ct.Candidate)
                    .WithMany(c => c.CandidateTags)
                    .HasForeignKey(ct => ct.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ct => ct.Tag)
                    .WithMany(t => t.CandidateTags)
                    .HasForeignKey(ct => ct.TagId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(ct => ct.Proficiency).HasMaxLength(50);

                entity.HasQueryFilter(ct => ct.Candidate != null &&
                                           ct.Candidate.User != null &&
                                           ct.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 10. APPLICATIONS
            // =================================================================
            modelBuilder.Entity<Application>(entity =>
            {
                entity.HasKey(a => a.AppId);
                entity.Property(a => a.AppId).UseIdentityColumn();

                entity.HasOne(a => a.Candidate)
                    .WithMany(c => c.Applications)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Job)
                    .WithMany(j => j.Applications)
                    .HasForeignKey(a => a.JobId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.AppliedDate).HasDefaultValueSql("now()");
                entity.Property(a => a.Status).HasDefaultValue(1);
                entity.Property(a => a.Message).HasMaxLength(1000);
                entity.Property(a => a.InterviewTime);
                entity.Property(a => a.InterviewLocation).HasMaxLength(500);
                entity.Property(a => a.CVUrl).HasMaxLength(500);
                entity.Property(a => a.DeletedAt);

                entity.HasIndex(a => new { a.UserId, a.JobId })
                    .IsUnique()
                    .HasDatabaseName("IX_Applications_UserId_JobId_Unique")
                    .HasFilter("deletedat IS NULL");

                entity.HasIndex(a => a.Status).HasDatabaseName("IX_Applications_Status");

                entity.HasQueryFilter(a => a.DeletedAt == null &&
                                          a.Candidate != null &&
                                          a.Candidate.User != null &&
                                          a.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 11. EXPERIENCES
            // =================================================================
            modelBuilder.Entity<Experience>(entity =>
            {
                entity.HasKey(e => e.ExpId);
                entity.Property(e => e.ExpId).UseIdentityColumn();

                entity.HasOne(e => e.Candidate)
                    .WithMany(c => c.Experiences)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.JobTitle).IsRequired().HasMaxLength(100);
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate);
                entity.Property(e => e.Description).HasMaxLength(2000);

                entity.HasQueryFilter(e => e.Candidate != null &&
                                          e.Candidate.User != null &&
                                          e.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 12. SAVED JOBS
            // =================================================================
            modelBuilder.Entity<SavedJob>(entity =>
            {
                entity.HasKey(sj => new { sj.UserId, sj.JobId });

                entity.HasOne(sj => sj.Candidate)
                    .WithMany()
                    .HasForeignKey(sj => sj.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sj => sj.Job)
                    .WithMany()
                    .HasForeignKey(sj => sj.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =================================================================
            // ÉP TẤT CẢ VỀ CHỮ THƯỜNG CHO POSTGRESQL
            // =================================================================
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // Đổi tên bảng (VD: Users -> users)
                entity.SetTableName(entity.GetTableName()?.ToLower());

                // Đổi tên cột (VD: UserId -> userid)
                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(property.Name.ToLower());
                }

                // Đổi tên Khóa chính, Khóa ngoại, Index
                foreach (var key in entity.GetKeys())
                    key.SetName(key.GetName()?.ToLower());

                foreach (var fk in entity.GetForeignKeys())
                    fk.SetConstraintName(fk.GetConstraintName()?.ToLower());

                foreach (var index in entity.GetIndexes())
                    index.SetDatabaseName(index.GetDatabaseName()?.ToLower());
            }
        }
    }
}