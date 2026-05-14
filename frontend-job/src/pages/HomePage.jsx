import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';

function HomePage() {
  const [filters, setFilters] = useState({
      keyword: '',
      locationId: '',
      tagId: '',
      minSalary: '',
      maxSalary: ''
  });

  return (
    <div className="app-wrapper">
      <main className="content">
        {/* Truyền hàm setFilters cho SearchBar để nó bỏ điều kiện vào giỏ */}
        <SearchBar onSearch={setFilters} />
        <JobList filters={filters} />
      </main>
    </div>
  );
}

export default HomePage;