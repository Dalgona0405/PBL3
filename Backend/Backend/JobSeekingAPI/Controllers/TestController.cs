using Microsoft.AspNetCore.Mvc;

namespace JobSeekingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("JobSeekingAPI is running successfully!");
        }
    }
}