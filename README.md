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
