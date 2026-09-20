# 🌟 AI-Powered Job Seeking Platform
**Da Nang University of Science and Technology (DUT)**

**PBL3 - Project Based Learning 3**
---
## 📖 Introduction
This project is a comprehensive job-seeking platform designed to seamlessly connect **Candidates** and **Recruiters**. The standout feature of this system is the integration of **Artificial Intelligence (Graph Neural Networks - GNN)** to analyze recruitment data, provide smart job recommendations, and forecast salary ranges.
The system is built using a modern, microservice-inspired architecture comprising four main independent components: a responsive Frontend, a robust Core API, a specialized AI Service, and an automated Data Crawler.
## 🚀 Key Features
### 🧑‍💻 For Candidates
- **Smart Search & Filters:** Search for jobs by keywords, locations, and skill tags.
- **Profile & CV Management:** Update skills, experiences, and track application history.
- **AI Job Suggestions:** Receive personalized job recommendations based on your profile and application history.
- **Salary Forecast:** Utilize AI to predict and analyze expected salary ranges for specific job titles and skills.
### 🏢 For Recruiters & Companies
- **Job Management:** Post, edit, and manage hiring campaigns efficiently.
- **Applicant Tracking:** Review candidate profiles, schedule interviews, and send automated notifications.
- **Company Profile:** Manage company details, branding, and staff access.
### 🛠️ For Administrators
- **Analytics Dashboard:** Monitor system statistics, revenue, and recruitment trends.
- **System Management:** Manage users, skill tags, locations, and approve company join requests.
## 🏗️ Tech Stack & Architecture
The system is divided into four distinct components to ensure scalability and maintainability:
1. **Frontend (User Interface):**
    - **Framework:** React.js powered by Vite for fast building.
    - **Styling:** TailwindCSS for a responsive and modern UI.
2. **Backend (Core API):**
    - **Framework:** C# .NET Core Web API.
    - **ORM & Database:** Entity Framework Core with **Microsoft SQL Server**.
    - **Background Services:** Asynchronous workers for syncing data with the AI model (`GNNUpdateWorker`, `SalaryAnalyticsWorker`).
3. **AI Service:**
    - **Language/Libraries:** Python, PyTorch.
    - **Model:** Graph Neural Networks (GNN) featuring both Encoder and Regressor models for prediction.
4. **Data Crawler:**
    - **Scripts:** Python scripts to automatically scrape real-world job and company data to enrich the database.
## 📂 Project Structure
```
├── AI_Service/          # Python service containing GNN models and prediction endpoints
├── Backend/             # C# .NET Core Web API (Controllers, Services, Repositories, DTOs)
├── Crawl/               # Python crawler scripts and raw data (.csv, .sql)
├── frontend-job/        # ReactJS frontend application (Components, Pages, Hooks)
└── README.md
```
## ⚙️ Getting Started
Follow these steps to set up the project on your local machine.
### 1. Database & Crawl Data Setup
- Open **SQL Server Management Studio (SSMS)**.
- Execute the `JobSeeking_DB.sql` script located in the `Crawl/` folder to generate the schema and seed initial data.
- *Alternatively:* Run EF Core migrations in the Backend folder: `dotnet ef database update`.
### 2. Backend (.NET API) Setup
- Navigate to the `Backend/Backend` folder and open the solution in **Visual Studio 2022** or VS Code.
- Update your SQL Server connection string in the `appsettings.json` file.
- Run the application (`dotnet run`). The API will typically run on `http://localhost:5000` or `https://localhost:5001`.
### 3. AI Service (Python) Setup
- Navigate to the `AI_Service` directory.
- Install required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
- Run the AI server:
    ```bash
    python main.py
    ```
### 4. Frontend (React) Setup
- Navigate to the `frontend-job` directory.
- Install NPM packages:
    ```bash
    npm install
    ```
- Start the development server:
    ```bash
    npm run dev
    ```
## 👥 Authors & Acknowledgments
- **[Thi Nguyễn Thanh Trúc]** – *Backend Developer, Frontend Developer, UI/UX Design, Database Design & Data Crawling*
- **[Trần Bá Thanh]** – *Backend Developer, AI Engineer & Data Processing*
- **Instructor:** *[Assoc. Prof. Dr. Nguyễn Tấn Khôi]*
