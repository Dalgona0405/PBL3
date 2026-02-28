CREATE DATABASE JobSeeking_DB;
GO

USE JobSeeking_DB;
GO

CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE, -- Email không được trùng
    Password VARCHAR(255) NOT NULL,     -- Hash Password
    
    -- Role: 1-Candidate, 2-Recruiter, 3-Admin
    Role INT NOT NULL DEFAULT 1 CHECK (Role IN (1, 2, 3)), 
    
    Avatar NVARCHAR(MAX),               -- Link ảnh đại diện
    LastLogin DATETIME,
    DeletedAt DATETIME                  -- Xóa mềm (Soft Delete)
);
GO

CREATE TABLE Locations (
    LocationId INT IDENTITY(1,1) PRIMARY KEY,
    LocationName NVARCHAR(100) NOT NULL
);
GO

-- Dùng chung cho cả Job và Candidate để so khớp (Matching)
CREATE TABLE Tags (
    TagId INT IDENTITY(1,1) PRIMARY KEY,
    TagName NVARCHAR(50) NOT NULL,      -- VD: Java, N3, Communication
    Type NVARCHAR(50)                   -- VD: Skill, Language, Certificate
);
GO

CREATE TABLE Companies (
    CompanyId INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(200) NOT NULL,
    LogoImg NVARCHAR(MAX),
    Website VARCHAR(200),
    Size NVARCHAR(50),                  -- VD: 10-50 nhân viên
    DeletedAt DATETIME
);
GO

-- Quan hệ 1-1 với Users
CREATE TABLE Candidates (
    UserId INT PRIMARY KEY,             -- Vừa là PK, vừa là FK
    FullName NVARCHAR(100) NOT NULL,
    Gender NVARCHAR(10),                
    Birthday DATE,
    Phone VARCHAR(20),
    Address NVARCHAR(500),
    CVUrl NVARCHAR(MAX),
    -- Ràng buộc khóa ngoại trỏ về Users
    CONSTRAINT FK_Candidates_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Quan hệ 1-1 với Users và n-1 với Companies
CREATE TABLE Recruiters (
    UserId INT PRIMARY KEY,             -- Vừa là PK, vừa là FK
    CompanyId INT NOT NULL,
    Position NVARCHAR(100),             -- VD: HR Manager
    CONSTRAINT FK_Recruiters_Users FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT FK_Recruiters_Companies FOREIGN KEY (CompanyId) REFERENCES Companies(CompanyId)
);
GO

CREATE TABLE Jobs (
    JobId INT IDENTITY(1,1) PRIMARY KEY,
    CompanyId INT NOT NULL,
    OriginalId VARCHAR(50),             -- ID gốc khi Crawl từ web khác (nếu có)
    Title NVARCHAR(200) NOT NULL,       -- Tiêu đề công việc
    SalaryMin DECIMAL(18, 2),
    SalaryMax DECIMAL(18, 2),
    ExpYear NVARCHAR(50),
    Level NVARCHAR(50),                 -- VD: Junior, Senior, Manager
    PostedDate DATETIME DEFAULT GETDATE(),
    Deadline DATETIME,
    LocationId INT,
    Description NVARCHAR(MAX),          -- Mô tả chi tiết (HTML hoặc Text dài)
    Requirement NVARCHAR(MAX),          -- Yêu cầu
    Benefits NVARCHAR(MAX),             -- Quyền lợi
    Address NVARCHAR(500),              -- Địa chỉ cụ thể
    ViewCount INT DEFAULT 0,            -- Đếm lượt xem
    DeletedAt DATETIME,
    CONSTRAINT FK_Jobs_Companies FOREIGN KEY (CompanyId) REFERENCES Companies(CompanyId),
    CONSTRAINT FK_Jobs_Locations FOREIGN KEY (LocationId) REFERENCES Locations(LocationId)
);
GO

CREATE TABLE JobTags (
    JobId INT NOT NULL,
    TagId INT NOT NULL,
    -- Khóa chính phức hợp (Composite Key) để tránh trùng lặp
    PRIMARY KEY (JobId, TagId),
    CONSTRAINT FK_JobTags_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    CONSTRAINT FK_JobTags_Tags FOREIGN KEY (TagId) REFERENCES Tags(TagId)
);
GO

CREATE TABLE CandidateTags (
    UserId INT NOT NULL,               -- Trỏ về Candidates
    TagId INT NOT NULL,
    Proficiency NVARCHAR(50),          -- VD: Beginner, Advanced, Native
    PRIMARY KEY (UserId, TagId),
    CONSTRAINT FK_CandidateTags_Candidates FOREIGN KEY (UserId) REFERENCES Candidates(UserId),
    CONSTRAINT FK_CandidateTags_Tags FOREIGN KEY (TagId) REFERENCES Tags(TagId)
);
GO

CREATE TABLE Applications (
    AppId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    JobId INT NOT NULL,
    AppliedDate DATETIME DEFAULT GETDATE(),
    Status INT DEFAULT 0,              -- 0: Pending, 1: Approved, 2: Rejected
    CVUrl NVARCHAR(MAX),               -- CV riêng cho Job này (nếu có)
    DeletedAt DATETIME,
    CONSTRAINT FK_Applications_Candidates FOREIGN KEY (UserId) REFERENCES Candidates(UserId),
    CONSTRAINT FK_Applications_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId)
);
GO

CREATE TABLE Experiences (
    ExpId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CompanyName NVARCHAR(200),
    JobTitle NVARCHAR(100),
    StartDate DATE,
    EndDate DATE,                      -- Nếu NULL nghĩa là "Đang làm việc"
    Description NVARCHAR(MAX),
    CONSTRAINT FK_Experiences_Candidates FOREIGN KEY (UserId) REFERENCES Candidates(UserId)
);
GO