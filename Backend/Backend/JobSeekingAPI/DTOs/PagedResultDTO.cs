using System;
using System.Collections.Generic;

namespace JobSeekingAPI.DTOs
{
    // DTO bọc ngoài để làm chức năng phân trang (Next/Prev Page)
    public class PagedResultDTO<T>
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious => Page > 1;
        public bool HasNext => Page < TotalPages;
        public List<T> Items { get; set; } = new();
    }
}