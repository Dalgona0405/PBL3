using JobSeekingAPI.Data;
using JobSeekingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace JobSeekingAPI.Repositories
{
    public class ExperienceRepository : BaseRepository<Experience>, IExperienceRepository
    {
        public ExperienceRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Experience>> GetExperiencesByCandidateIdAsync(int candidateId)
        {
            return await _context.Experiences
                .Where(e => e.UserId == candidateId)
                .OrderByDescending(e => e.StartDate)
                .ToListAsync();
        }

        public async Task<Experience?> GetExperienceByIdAsync(int experienceId)
        {
            return await _context.Experiences.FindAsync(experienceId);
        }

        public async Task<Experience> AddExperienceAsync(Experience experience)
        {
            _context.Experiences.Add(experience);
            await _context.SaveChangesAsync();
            return experience;
        }

        public async Task UpdateExperienceAsync(Experience experience)
        {
            _context.Experiences.Update(experience);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteExperienceAsync(int experienceId)
        {
            var experience = await _context.Experiences.FindAsync(experienceId);
            if (experience != null)
            {
                _context.Experiences.Remove(experience);
                await _context.SaveChangesAsync();
            }
        }
    }
}