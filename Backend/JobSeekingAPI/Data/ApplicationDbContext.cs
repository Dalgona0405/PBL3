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
        public DbSet<Interview> Interviews { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =================================================================
            // 1. USERS
            // =================================================================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                entity.Property(u => u.UserId).UseIdentityColumn();

                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.GoogleId).IsUnique().HasFilter("googleid IS NOT NULL");

                entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Password).IsRequired().HasMaxLength(255);
                entity.Property(u => u.Role).IsRequired();
                entity.Property(u => u.Avatar).HasMaxLength(500);
                entity.Property(u => u.GoogleId).HasMaxLength(255);

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
                entity.Property(c => c.TaxCode).HasMaxLength(50);
                entity.Property(c => c.IsVerified).HasDefaultValue(false);

                entity.HasOne(c => c.MasterUser)
                    .WithMany()
                    .HasForeignKey(c => c.MasterUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasQueryFilter(c => c.DeletedAt == null);
            });

            // =================================================================
            // 3. LOCATIONS & 4. TAGS
            // =================================================================
            modelBuilder.Entity<Location>(entity =>
            {
                entity.HasKey(l => l.LocationId);
                entity.Property(l => l.LocationId).UseIdentityColumn();
                entity.Property(l => l.LocationName).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(t => t.TagId);
                entity.Property(t => t.TagId).UseIdentityColumn();
                entity.Property(t => t.TagName).IsRequired().HasMaxLength(50);
                entity.Property(t => t.Type).HasMaxLength(50);
                entity.HasIndex(t => t.TagName).IsUnique();
            });

            // =================================================================
            // 5. CANDIDATES & 6. RECRUITERS
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
                entity.Property(c => c.Phone).HasMaxLength(20);
                entity.Property(c => c.Address).HasMaxLength(500);
                entity.Property(c => c.CVUrl).HasMaxLength(500);

                entity.HasQueryFilter(c => c.User != null && c.User.DeletedAt == null);
            });

            modelBuilder.Entity<Recruiter>(entity =>
            {
                entity.HasKey(r => r.UserId);
                entity.Property(r => r.UserId).ValueGeneratedNever();

                entity.HasOne(r => r.User)
                    .WithOne(u => u.Recruiter)
                    .HasForeignKey<Recruiter>(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Cho phép CompanyId là Null (Freelance Recruiter)
                entity.HasOne(r => r.Company)
                    .WithMany(c => c.Recruiters)
                    .HasForeignKey(r => r.CompanyId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(r => r.Position).HasMaxLength(100);

                entity.HasQueryFilter(r => r.User != null && r.User.DeletedAt == null);
            });

            modelBuilder.Entity<CompanyJoinRequest>(entity =>
            {
                entity.HasKey(r => r.RequestId);
                entity.Property(r => r.RequestId).UseIdentityColumn();
                entity.Property(r => r.CreatedAt).HasDefaultValueSql("now()");

                entity.HasQueryFilter(r => r.Company != null && r.Company.DeletedAt == null &&
                                           r.Recruiter != null && r.Recruiter.User != null && r.Recruiter.User.DeletedAt == null);
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
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(j => j.PostedByUserId).HasColumnName("postedbyuserid");

                entity.HasOne(j => j.Location)
                    .WithMany(l => l.Jobs)
                    .HasForeignKey(j => j.LocationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(j => j.OriginalId).HasMaxLength(50);
                entity.Property(j => j.Title).IsRequired().HasMaxLength(200);
                entity.Property(j => j.SalaryMin).HasPrecision(18, 2);
                entity.Property(j => j.SalaryMax).HasPrecision(18, 2);
                entity.Property(j => j.Level).HasMaxLength(50);
                entity.Property(j => j.PostedDate).HasDefaultValueSql("now()");

                entity.Property(j => j.Description).HasColumnType("text");
                entity.Property(j => j.Requirement).HasColumnType("text");
                entity.Property(j => j.Benefits).HasColumnType("text");

                entity.Property(j => j.Address).HasMaxLength(500);
                entity.Property(j => j.ViewCount).HasDefaultValue(0);
                entity.Property(j => j.Status).HasDefaultValue(1);

                // Đánh Composite Index giúp truy vấn trang chủ / lọc việc làm < 50ms
                entity.HasIndex(j => new { j.Status, j.PostedDate });

                entity.HasQueryFilter(j => j.DeletedAt == null);
            });

            // =================================================================
            // 8. JOB TAGS & 9. CANDIDATE TAGS
            // =================================================================
            modelBuilder.Entity<JobTag>(entity =>
            {
                entity.HasKey(jt => new { jt.JobId, jt.TagId });
                entity.HasOne(jt => jt.Job).WithMany(j => j.JobTags).HasForeignKey(jt => jt.JobId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(jt => jt.Tag).WithMany(t => t.JobTags).HasForeignKey(jt => jt.TagId).OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(jt => jt.Job != null && jt.Job.DeletedAt == null);
            });

            modelBuilder.Entity<CandidateTag>(entity =>
            {
                entity.HasKey(ct => new { ct.UserId, ct.TagId });
                entity.HasOne(ct => ct.Candidate).WithMany(c => c.CandidateTags).HasForeignKey(ct => ct.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(ct => ct.Tag).WithMany(t => t.CandidateTags).HasForeignKey(ct => ct.TagId).OnDelete(DeleteBehavior.Restrict);
                entity.Property(ct => ct.Proficiency).HasMaxLength(50);
                entity.HasQueryFilter(ct => ct.Candidate != null && ct.Candidate.User != null && ct.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 10. APPLICATIONS
            // =================================================================
            modelBuilder.Entity<Application>(entity =>
            {
                entity.HasKey(a => a.AppId);
                entity.Property(a => a.AppId).UseIdentityColumn();

                entity.HasOne(a => a.Candidate).WithMany(c => c.Applications).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(a => a.Job).WithMany(j => j.Applications).HasForeignKey(a => a.JobId).OnDelete(DeleteBehavior.Restrict);

                entity.Property(a => a.AppliedDate).HasDefaultValueSql("now()");
                entity.Property(a => a.Status).HasDefaultValue(1);
                entity.Property(a => a.Message).HasMaxLength(1000);
                entity.Property(a => a.InterviewLocation).HasMaxLength(500);
                entity.Property(a => a.CVUrl).HasMaxLength(500);

                // Lưu cấu thành điểm AI dưới dạng jsonb tối ưu của PostgreSQL
                entity.Property(a => a.AiScoreBreakdown).HasColumnType("jsonb");

                entity.HasIndex(a => new { a.UserId, a.JobId })
                    .IsUnique()
                    .HasDatabaseName("ix_applications_userid_jobid_unique")
                    .HasFilter("deletedat IS NULL");

                // Composite Index phục vụ tải bảng Kanban theo từng Job cực nhanh
                entity.HasIndex(a => new { a.JobId, a.Status }).HasDatabaseName("ix_applications_jobid_status");

                entity.HasQueryFilter(a => a.DeletedAt == null &&
                                           a.Job != null && a.Job.DeletedAt == null &&
                                           a.Candidate != null && a.Candidate.User != null && a.Candidate.User.DeletedAt == null);
            });

            // =================================================================
            // 11. EXPERIENCES, 12. SAVED JOBS, 13. NOTIFICATIONS
            // =================================================================
            modelBuilder.Entity<Experience>(entity =>
            {
                entity.HasKey(e => e.ExpId);
                entity.Property(e => e.ExpId).UseIdentityColumn();
                entity.HasOne(e => e.Candidate).WithMany(c => c.Experiences).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.JobTitle).IsRequired().HasMaxLength(100);
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.HasQueryFilter(e => e.Candidate != null && e.Candidate.User != null && e.Candidate.User.DeletedAt == null);
            });

            modelBuilder.Entity<SavedJob>(entity =>
            {
                entity.HasKey(sj => new { sj.UserId, sj.JobId });
                entity.HasOne(sj => sj.Candidate).WithMany().HasForeignKey(sj => sj.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(sj => sj.Job).WithMany().HasForeignKey(sj => sj.JobId).OnDelete(DeleteBehavior.Cascade);
                entity.HasQueryFilter(sj => sj.Candidate != null && sj.Candidate.User != null && sj.Candidate.User.DeletedAt == null &&
                                     sj.Job != null && sj.Job.DeletedAt == null);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.NotificationId);
                entity.Property(n => n.NotificationId).UseIdentityColumn();
                entity.Property(n => n.Title).IsRequired().HasMaxLength(255);
                entity.Property(n => n.Content).HasMaxLength(1000);
                entity.Property(n => n.IsRead).HasDefaultValue(false);
                entity.Property(n => n.CreatedAt).HasDefaultValueSql("now()");
                entity.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
                entity.HasQueryFilter(n => n.User != null && n.User.DeletedAt == null);
            });

            // =================================================================
            // 14. INTERVIEWS
            // =================================================================
            modelBuilder.Entity<Interview>(entity =>
            {
                entity.HasKey(i => i.InterviewId);
                entity.Property(i => i.InterviewId).UseIdentityColumn();

                entity.HasOne(i => i.Application)
                    .WithMany(a => a.Interviews)
                    .HasForeignKey(i => i.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(i => i.InterviewType).IsRequired().HasMaxLength(50);
                entity.Property(i => i.MeetingLink).HasMaxLength(500);
                entity.Property(i => i.Location).HasMaxLength(255);
                entity.Property(i => i.CalendarEventUid).HasMaxLength(255);
                entity.Property(i => i.CreatedAt).HasDefaultValueSql("now()");
                entity.HasQueryFilter(i => i.Application != null && i.Application.DeletedAt == null);
            });

            // =================================================================
            // 15. MESSAGES
            // =================================================================
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.MessageId);
                entity.Property(m => m.MessageId).UseIdentityColumn();

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Receiver)
                    .WithMany()
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Job)
                    .WithMany()
                    .HasForeignKey(m => m.JobId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.Property(m => m.Content).IsRequired().HasMaxLength(4000);
                entity.Property(m => m.IsRead).HasDefaultValue(false);
                entity.Property(m => m.SentAt).HasDefaultValueSql("now()");

                // Composite Index cho truy vấn lịch sử chat 1-1 theo thời gian
                entity.HasIndex(m => new { m.SenderId, m.ReceiverId, m.SentAt })
                    .HasDatabaseName("ix_messages_conversation_timeline");

                entity.HasQueryFilter(m => m.Sender != null && m.Sender.DeletedAt == null &&
                                    m.Receiver != null && m.Receiver.DeletedAt == null);
            });

            // =================================================================
            // GIỮ TƯƠNG THÍCH VỚI DỮ LIỆU CŨ (01_seed_data.sql) CỦA POSTGRESQL
            // =================================================================
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                var tableName = entity.GetTableName();
                if (tableName != null && !tableName.StartsWith("__EF"))
                {
                    entity.SetTableName(tableName.ToLowerInvariant());
                }

                foreach (var property in entity.GetProperties())
                {
                    property.SetColumnName(property.Name.ToLowerInvariant());
                }

                foreach (var key in entity.GetKeys())
                    key.SetName(key.GetName()?.ToLowerInvariant());

                foreach (var fk in entity.GetForeignKeys())
                    fk.SetConstraintName(fk.GetConstraintName()?.ToLowerInvariant());

                foreach (var index in entity.GetIndexes())
                    index.SetDatabaseName(index.GetDatabaseName()?.ToLowerInvariant());
            }
        }
    }
}