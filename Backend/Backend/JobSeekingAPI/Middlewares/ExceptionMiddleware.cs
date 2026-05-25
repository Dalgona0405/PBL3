using System.Net;
using System.Text.Json;

namespace JobSeekingAPI.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Something went wrong: {ex}");
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            // Mặc định là lỗi 500 (Lỗi hệ thống sập, đứt cáp, AI chết...)
            var statusCode = (int)HttpStatusCode.InternalServerError;
            var message = "Hệ thống đang bận, vui lòng thử lại sau!";

            // Phân loại lỗi để trả về đúng mã HTTP Status Code
            switch (exception)
            {
                case ArgumentException e:
                    statusCode = (int)HttpStatusCode.BadRequest; // 400 - Lỗi do user nhập sai
                    message = e.Message;
                    break;
                case KeyNotFoundException e:
                    statusCode = (int)HttpStatusCode.NotFound; // 404 - Không tìm thấy dữ liệu
                    message = e.Message;
                    break;
                case UnauthorizedAccessException e:
                    statusCode = (int)HttpStatusCode.Forbidden; // 403 - Không có quyền truy cập
                    message = e.Message;
                    break;
                default:
                    // message = exception.Message; // Mở khi cần debug lỗi hệ thống, đóng khi deploy để tránh lộ thông tin nhạy cảm
                    break;
            }

            context.Response.StatusCode = statusCode;

            var result = JsonSerializer.Serialize(new
            {
                message = message
            });

            return context.Response.WriteAsync(result);
        }
    }
}