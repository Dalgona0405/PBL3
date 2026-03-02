import React from 'react';

function JobCard(props) {
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
      <p className="job-location">Địa điểm: {props.location?.locationName}</p>
      <p className="job-salary">Lương: {displaySalary}</p>
      <button className="btn-detail">Xem chi tiết</button>
    </div>
  );
}
export default JobCard;