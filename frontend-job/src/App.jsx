import { useState, useEffect } from 'react'

const styles = {
  container: {
    padding: '40px 20px',
    backgroundColor: '#FAF9F6', // Màu trắng kem (Soft Autumn)
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#4A5D23' // Xanh rêu đậm (Tinh tế, chuyên nghiệp)
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px', // Bo góc tròn trịa, mềm mại
    padding: '24px',
    boxShadow: '0 10px 20px rgba(74, 93, 35, 0.05)', // Đổ bóng nhẹ màu rêu
    transition: 'transform 0.3s ease',
    border: '1px solid #E9E4D9', // Viền màu be nhạt
    cursor: 'pointer'
  },
  jobTitle: {
    color: '#0056b3',
    fontSize: '1.2rem',
    marginBottom: '12px',
    fontWeight: '600'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#555',
    fontSize: '0.95rem',
    margin: '8px 0'
  },
  tag: {
    backgroundColor: '#F0EDE5',
    color: '#6B5E4C',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  }
};

function App() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/Jobs')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{fontSize: '2.5rem', marginBottom: '10px'}}>🌿 IT Job Hub</h1>
        <p style={{color: '#8C7D67'}}>Tìm kiếm cơ hội nghề nghiệp tinh tế tại Đà Nẵng</p>
      </header>

      <div style={styles.grid}>
        {jobs.map((job) => (
          <div 
            key={job.jobId} 
            style={styles.card}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={styles.tag}>{job.level || 'Fresher'}</div>
            <h2 style={styles.jobTitle}>{job.title}</h2>
            
            <div style={styles.infoItem}>
              <span>📍</span> <span>Khu vực: {job.locationId === 1 ? 'Đà Nẵng' : 'Toàn quốc'}</span>
            </div>
            
            <div style={styles.infoItem}>
              <span>💰</span> 
              <span>
                {job.salaryMin && job.salaryMax 
                  ? `${job.salaryMin} - ${job.salaryMax} Triệu` 
                  : 'Thỏa thuận'}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span>⏳</span> <span>Kinh nghiệm: {job.expYear || 'Không yêu cầu'}</span>
            </div>

            <button style={{
              marginTop: '15px',
              width: '100%',
              padding: '10px',
              backgroundColor: '#4A5D23',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              Ứng tuyển ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;