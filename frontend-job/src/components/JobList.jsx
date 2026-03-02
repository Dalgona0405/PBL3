import React from 'react';
import { useState, useEffect } from 'react';
import JobCard from './JobCard';

function JobList() {
    const [jobs, setJobs] = useState([]);
    useEffect(() => {
        fetch('http://localhost:5000/api/Jobs')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                setJobs(data);
            })
            .catch(error => console.error('Error fetching jobs:', error));
    }, []);

    return (
        <div className="job-list-container">
            <h2 className="job-list-title">Danh sách công việc</h2>

            <div className="list-grid">
                {jobs.map((job) => (
                    <JobCard
                        key={job.jobId}
                        title={job.title}
                        company={job.company}
                        location={job.location}
                        salaryMin={job.salaryMin}
                        salaryMax={job.salaryMax}
                    />
                ))}
            </div>
        </div>
    );
}
export default JobList;