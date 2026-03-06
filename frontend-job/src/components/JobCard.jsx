import React from 'react';
import { useNavigate } from 'react-router-dom';

function JobCard(props) {
    const navigate = useNavigate();
    let displaySalary = "";
    if (!props.salaryMin && !props.salaryMax) {
        displaySalary = "Thỏa thuận";
    } 
    else {
        displaySalary = `${props.salaryMin} - ${props.salaryMax} triệu`; 
  }
  return (
    <div className="job-card">
      <h3 className="job-title">{props.title}</h3>
      <p className="job-company">Công ty: {props.company?.companyName || "Chưa cập nhật"}</p>
      <p className="job-location">Khu vực: {props.location?.locationName}</p>
      <p className="job-salary">Lương: {displaySalary}</p>
      <button className="btn-detail" onClick={() => navigate(`/detail-job/${props.jobId}`)}>
        Xem chi tiết
      </button>
    </div>
  );
}
export default JobCard;