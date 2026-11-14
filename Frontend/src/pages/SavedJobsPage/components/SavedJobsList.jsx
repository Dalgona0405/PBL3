import React from 'react';
import JobCard from '../../../components/common/JobCard';

function SavedJobsList({ savedJobs, onRemoveJob }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((item) => {
                const job = item.job || item;
                const companyData = job.company || {
                    companyName: job.companyName,
                    logoImg: job.logoImg
                };
                const locationData = job.location || {
                    locationName: job.locationName
                };

                return (
                    <JobCard
                        key={job.jobId}
                        jobId={job.jobId}
                        title={job.title}
                        company={companyData}
                        location={locationData}
                        salaryMin={job.salaryMin}
                        salaryMax={job.salaryMax}
                        isSaved={true}
                        onRemove={onRemoveJob}
                    />
                );
            })}
        </div>
    );
}

export default SavedJobsList;
