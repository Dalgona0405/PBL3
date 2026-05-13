import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';

function HomePage() {
  const [keyword, setKeyword] = useState('');

  return (
    <div className="app-wrapper">
      <main className="content">
        <SearchBar onSearch={setKeyword} />
        <JobList keyword={keyword} />
      </main>
    </div>
  );
}

export default HomePage;