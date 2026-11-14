import React from 'react';
import JobCard from '../../../components/common/JobCard';

function SuggestedJobGrid({ jobs }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((item, index) => {
                const actualJob = item.job || item;
                const currentJobId = actualJob.jobId;
                const companyInfo = actualJob.company || {
                    companyName: actualJob.companyName,
                    logoImg: actualJob.logoImg
                };
                const locationInfo = actualJob.location || {
                    locationName: actualJob.locationName || actualJob.LocationName
                };

                return (
                    <JobCard
                        key={currentJobId || index}
                        jobId={currentJobId}
                        title={actualJob.title || actualJob.Title}
                        company={companyInfo}
                        location={locationInfo}
                        salaryMin={actualJob.salaryMin || actualJob.SalaryMin}
                        salaryMax={actualJob.salaryMax || actualJob.SalaryMax}
                        level={actualJob.level || actualJob.Level}
                        expYear={actualJob.expYear || actualJob.ExpYear}
                        isScraped={actualJob.isScraped}
                        originalId={actualJob.originalId}
                        matchScore={item.matchScore}
                        breakdown={item.breakdown}
                        missingSkills={item.missingSkills}
                        advice={item.advice}
                    />
                );
            })}
        </div>
    );
}

export default SuggestedJobGrid;
