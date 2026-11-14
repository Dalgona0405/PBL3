export function parseAiScorePayload(matchScore, rawBreakdown) {
    let parsed = rawBreakdown;
    if (typeof rawBreakdown === 'string') {
        try {
            parsed = JSON.parse(rawBreakdown);
        } catch {
            parsed = {};
        }
    }
    const data = parsed || {};
    const bd = data.breakdown || data.Breakdown || {};
    return {
        matchScore: matchScore ?? data.matchScore ?? data.MatchScore,
        advice: data.advice ?? data.Advice ?? '',
        missingSkills: data.missingSkills ?? data.MissingSkills ?? [],
        breakdown: {
            skillScore: Number(bd.skillScore ?? bd.SkillScore ?? 0),
            experienceScore: Number(bd.experienceScore ?? bd.ExperienceScore ?? 0),
            locationScore: Number(bd.locationScore ?? bd.LocationScore ?? 0),
            domainScore: Number(bd.domainScore ?? bd.DomainScore ?? 0)
        }
    };
}
