import React from "react";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import { API_URLS } from "../api/api";
import "../App.css";

function DetailJobPage() {
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
        <div className="app-wrapper">
        <Header />
        <div className="detail-job-container">
            <h2>Chi tiết công việc</h2>
                <div className="job-detail">
                    {jobs.map(job => (
                        <div key={job.id}>
                            <h3>{job.title}</h3>
                            <p>{job.description}</p>
                        </div>
                    ))}
                </div>
        </div>
        </div>
    );
}

export default DetailJobPage;