using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

// ✅ THÊM USING CHO REPOSITORIES (DÙ ĐANG COMMENT)
using JobSeekingAPI.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ===== Services =====
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 🚨 TẠM THỜI COMMENT - CHỜ FIX SAU
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();

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

var app = builder.Build();

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

app.UseCors("AllowAll");

// app.UseAuthentication();
app.UseCors("AllowReactApp");
app.UseAuthorization();

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