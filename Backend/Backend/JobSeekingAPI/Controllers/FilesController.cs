using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        public FilesController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
            return Ok(new { Url = fileUrl });
        }
    }
}