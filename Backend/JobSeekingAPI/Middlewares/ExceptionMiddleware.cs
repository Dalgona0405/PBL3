using System.Net;
using System.Text.Json;
using JobSeekingAPI.Helpers;

namespace JobSeekingAPI.Middlewares
{
    /// <summary>
    /// Middleware xử lý ngoại lệ tập trung, chuyển đổi Exception nghiệp vụ thành mã HTTP Status và JSON thống nhất
    /// </summary>
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// Chặn và xử lý mọi ngoại lệ phát sinh trong quá trình thực thi HTTP Request
        /// </summary>
        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred while processing request.");
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        /// <summary>
        /// Ánh xạ loại ngoại lệ sang HTTP Status Code và thông điệp phản hồi chuẩn hóa
        /// </summary>
        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            // Mặc định trả về lỗi 500 cho các ngoại lệ hệ thống chưa được xử lý tường minh
            var statusCode = (int)HttpStatusCode.InternalServerError;
            var message = "Hệ thống đang bận, vui lòng thử lại sau!";

            switch (exception)
            {
                case ArgumentException e:
                    statusCode = (int)HttpStatusCode.BadRequest; // 400 - Dữ liệu đầu vào hoặc nghiệp vụ không hợp lệ
                    message = e.Message;
                    break;
                case InvalidOperationException e:
                    statusCode = (int)HttpStatusCode.BadGateway; // 502 - Lỗi giao tiếp với dịch vụ bên ngoài (Cloud Storage / AI Server)
                    message = e.Message;
                    break;
                case UnauthorizedAccessException e:
                    statusCode = (int)HttpStatusCode.Unauthorized; // 401 - Chưa xác thực hoặc thông tin đăng nhập không hợp lệ
                    message = e.Message;
                    break;
                case ForbiddenAccessException e:
                    statusCode = (int)HttpStatusCode.Forbidden; // 403 - Không có quyền truy cập
                    message = e.Message;
                    break;
                case KeyNotFoundException e:
                    statusCode = (int)HttpStatusCode.NotFound; // 404 - Không tìm thấy dữ liệu
                    message = e.Message;
                    break;
                default:
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
