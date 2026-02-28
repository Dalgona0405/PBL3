// Đang dùng trong JobRepository.cs nhưng chưa có file DTO
public class PagedResultDTO<T>
{
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
    public List<T> Data { get; set; } = new();
}