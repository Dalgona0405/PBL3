import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
import { API_URLS } from '../api/api';

function JobList() {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetch(API_URLS.JOBS) 
            .then(response => response.json())
            .then(data => {
                console.log("Dữ liệu từ API:", data);
                setJobs(data);
            })
            .catch(error => console.error('Lỗi lấy dữ liệu:', error));
    }, []);

    return (
        <div className="job-list-container">
            <h2 className="job-list-title">Danh sách công việc</h2>

            <div className="list-grid">
                {jobs.map((job) => (
                    <JobCard
                        key={job.jobId}
                        jobId={job.jobId}
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