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
    - **ORM & Database:** Entity Framework Core with **PostgreSQL 18**.
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
├── crawler_backup/      # Python crawler scripts and raw data (.csv)
├── db_init/             # Seed data for demo
├── Frontend/            # ReactJS frontend application (Components, Pages, Hooks)
└── README.md
```
## ⚙️ Getting Started
Follow these steps to set up the project on your local machine.

### Option A: Quick Start with Docker Compose (Recommended for Backend + AI + DB)
1. Copy the environment template at the repository root and configure your secrets:
   ```bash
   cp .env.example .env
   ```
   - Set a strong random `JWT_SECRET` (at least 32 characters — do **not** reuse any old key from git history).
   - Optionally fill in `GOOGLE_CLIENT_ID`, `CLOUDINARY_*`, `SUPABASE_*`, and `SMTP_*` (in `Development`, missing Cloudinary/Supabase/SMTP falls back to local file storage and mock email logging; in `Production`, `SUPABASE_*` is required for CV storage).
2. Start PostgreSQL 18, ASP.NET Core 8 Web API, and the Python AI Service:
   ```bash
   docker compose up -d --build
   ```
   - Database seed scripts in `db_init/` run automatically on first container initialization.
   - Backend API & Swagger: `http://localhost:5000/swagger`
   - AI Service (bound to localhost only): `http://127.0.0.1:8000/api/health`
3. Start the Frontend (see Step 4 below).

### Option B: Manual Local Setup
#### 1. Database & Seed Data Setup
- Run `docker compose up -d postgres-db` to start PostgreSQL 18 with the `db_init/` seed scripts, **or** create `JobSeeking_DB` on your local PostgreSQL 18 instance and run EF Core migrations from `Backend/JobSeekingAPI`:
  ```bash
  dotnet ef database update
  ```
#### 2. Backend (.NET 8 Web API) Setup
- `appsettings.json` intentionally leaves secrets (`Jwt:SecretKey`, `ConnectionStrings:DefaultConnection`, etc.) blank. Configure them in **`Backend/JobSeekingAPI/appsettings.Development.json`** (gitignored) or via **`dotnet user-secrets`**:
  ```bash
  cd Backend/JobSeekingAPI
  dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=JobSeeking_DB;Username=postgres;Password=admin"
  dotnet user-secrets set "Jwt:SecretKey" "<your-random-secret-at-least-32-chars>"
  ```
- Run the API (`dotnet run`), or execute the test suite from `Backend`:
  ```bash
  dotnet test JobSeekingAPI.Tests/JobSeekingAPI.Tests.csproj
  ```
- Swagger UI will be available at `http://localhost:5000/swagger` (or the port defined in `launchSettings.json`).
#### 3. AI Service (Python) Setup
- Navigate to the `AI_Service` directory and install required dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Run the AI server via Uvicorn (set `CSHARP_API_URL` if your Backend runs on a port other than `http://localhost:5000`):
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
#### 4. Frontend (React) Setup
- Navigate to the `Frontend` directory, install packages, and start the dev server:
  ```bash
  npm install
  npm run dev
  ```
## 📸 UI & Screenshots

*(Add your actual product images to the `images/` folder and update the links below to showcase your application)*

| Home Page | Job Details & AI Forecast |
| :---: | :---: |
| <img width="1920" height="1080" alt="Screenshot 2026-06-04 200306" src="https://github.com/user-attachments/assets/f8304ff7-5e0e-4a8d-806a-ccc11734713b" />| <img width="1920" height="1080" alt="Screenshot 2026-06-04 200328" src="https://github.com/user-attachments/assets/60141bd5-6adc-42c4-a994-72187d4d4ca8" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200351" src="https://github.com/user-attachments/assets/d1725093-3d81-4550-905c-eee4435b18b4" /><img width="1920" height="1080" alt="Screenshot 2026-06-04 200422" src="https://github.com/user-attachments/assets/0826a51c-ed22-4a5b-9647-b4dfc0b7ad1b" />|
| **Candidate Dashboard / Profile** | **Recruiter / Admin Dashboard** |
|<img width="1920" height="1080" alt="Screenshot 2026-06-04 200435" src="https://github.com/user-attachments/assets/e8225cdd-c729-4cae-a718-ab1cce7c462d" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200451" src="https://github.com/user-attachments/assets/571787ee-1b0e-42ac-b232-8e26b21cda1c" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200519" src="https://github.com/user-attachments/assets/79cba7d5-415c-49fb-8c15-ddb52bb7ad2e" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200529" src="https://github.com/user-attachments/assets/58d58641-57d1-44f8-9baf-1f2016cf5d17" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200542" src="https://github.com/user-attachments/assets/9141b4cf-63ae-488d-8a47-2baf99decefa" /> |  <img width="1920" height="1080" alt="Screenshot 2026-06-04 200905" src="https://github.com/user-attachments/assets/5ed1f915-ca80-4c1a-8527-36fa40be3510" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200912" src="https://github.com/user-attachments/assets/f7195df2-99b7-45ba-9692-83fedf02a4b4" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 200929" src="https://github.com/user-attachments/assets/55906b68-b9dc-4df3-a234-29ae61442e56" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 201003" src="https://github.com/user-attachments/assets/1493c119-fda2-4d88-a16b-c0974097055e" /> <img width="1920" height="1080" alt="Screenshot 2026-06-04 201406" src="https://github.com/user-attachments/assets/49b61ef5-617f-48f8-b4ac-e9e204f4566a" /> |

## 👥 Authors & Acknowledgments
- **[Thi Nguyễn Thanh Trúc]** – *Backend Developer, Frontend Developer, UI/UX Design, Database Design & Data Crawling*
- **[Trần Bá Thanh]** – *Backend Developer, AI Engineer & Data Processing*
- **Instructor:** *[Assoc. Prof. Dr. Nguyễn Tấn Khôi]*
