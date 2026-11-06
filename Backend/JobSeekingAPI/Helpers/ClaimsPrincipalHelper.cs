using System.Security.Claims;

namespace JobSeekingAPI.Helpers
{
    public static class ClaimsPrincipalHelper
    {
        public static int GetUserIdFromToken(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Cannot find valid UserId in token.");
        }
    }
}
