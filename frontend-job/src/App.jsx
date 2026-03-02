import React from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import JobList from './components/JobList';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <Header />
      <main className="content">
        <SearchBar />
        <JobList />
      </main>
    </div>
  );
}

export default App;