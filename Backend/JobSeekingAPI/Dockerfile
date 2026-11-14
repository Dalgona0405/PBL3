# =====================================================================
# STAGE 1: BUILD (Sử dụng .NET 8 SDK đầy đủ để biên dịch code)
# =====================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# 1. Copy file .csproj trước và chạy restore.
# TẠI SAO? Để tận dụng cơ chế Layer Caching của Docker. Nếu em chỉ sửa code C# 
# mà không cài thêm thư viện NuGet mới, Docker sẽ bỏ qua bước tải package, giúp build nhanh gấp 10 lần!
COPY ["JobSeekingAPI.csproj", "./"]
RUN dotnet restore "JobSeekingAPI.csproj"

# 2. Copy toàn bộ source code còn lại và tiến hành Publish ra bản Release
COPY . .
RUN dotnet publish "JobSeekingAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# =====================================================================
# STAGE 2: RUNTIME (Chỉ dùng bản ASP.NET Runtime siêu nhẹ Alpine Linux)
# =====================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

# Cài đặt gói hỗ trợ múi giờ và ngôn ngữ (Globalization) cho Alpine Linux
RUN apk add --no-cache icu-libs
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Tạo một non-root user để chạy ứng dụng (Chuẩn bảo mật Enterprise: 
# Nếu hacker chiếm được quyền điều khiển API cũng không có quyền root trong container)
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy thành phẩm đã biên dịch từ Stage 1 sang Stage 2
COPY --from=build /app/publish .

# Mặc định trong .NET 8, container lắng nghe ở cổng 8080 thay vì 80 như .NET 6/7
EXPOSE 8080

ENTRYPOINT ["dotnet", "JobSeekingAPI.dll"]