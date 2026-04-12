using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using JobSeekingAPI.Services;

// ✅ THÊM USING CHO REPOSITORIES (DÙ ĐANG COMMENT)
using JobSeekingAPI.Repositories;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ===== Services =====
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 🚨 TẠM THỜI COMMENT - CHỜ FIX SAU
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>(); // TẠM THỜI COMMENT - CHỜ FIX SAU Graph AI & Dashboard Stats
builder.Services.AddScoped<IReportService, ReportService>(); // TẠM THỜI COMMENT - CHỜ FIX SAU Graph AI & Dashboard Stats


builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
}); // CORS - TẠM THỜI COMMENT - CHỜ FIX SAU



builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "JobSeeking API",
        Version = "v1",
        Description = "Hệ thống môi giới và gợi ý việc làm",
        Contact = new OpenApiContact
        {
            Name = "Your Name",
            Email = "your.email@example.com",
            Url = new Uri("https://yourwebsite.com")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build(); // Noin builder.Build() để tạo ứng dụng từ cấu hình đã thiết lập ở trên

// ===== Middleware =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "JobSeeking API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "JobSeeking API Documentation";
    });
}
else
{
    app.UseHttpsRedirection();
}

// app.UseCors("AllowAll");

// app.UseAuthentication();
//builder.Services.AddScoped<JwtService>();
//builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = false,
//            ValidateAudience = false,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("THIS_IS_SECRET_KEY")),
//            ClockSkew = TimeSpan.Zero
//        };
//    });

app.UseCors("AllowReactApp");
app.UseAuthorization();
app.UseCors("AllowAll"); // Đặt sau UseAuthorization để đảm bảo CORS được áp dụng cho tất cả các endpoint, kể cả những endpoint yêu cầu xác thực
app.MapControllers();

// Redirect root → Swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

// ===== Initialize Database =====  
// 🚨 TẠM THỜI COMMENT - CHỜ FIX DBINITIALIZER SAU

//using (var scope = app.Services.CreateScope()) {
//    var services = scope.ServiceProvider;
//    var context = services.GetRequiredService<ApplicationDbContext>();
//    DbInitializer.Initialize(context);
//}

app.Run();