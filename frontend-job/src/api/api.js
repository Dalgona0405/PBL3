                 //http://localhost:5010/api
const BASE_URL = 'http://localhost:5000/api';

export const API_URLS = {
    JOBS: `${BASE_URL}/jobs`,
    COMPANIES: `${BASE_URL}/companies`,
    SEARCH: `${BASE_URL}/jobs/search`, 
    USERS: `${BASE_URL}/users`,
    REGISTER: `${BASE_URL}/auth/register`, 
    LOGIN: `${BASE_URL}/auth/login`, 
    APPLICATIONS: `${BASE_URL}/applications`,
    TAGS: `${BASE_URL}/tags`,
    CANDIDATE_TAGS: `${BASE_URL}/candidates/me/skills`, 
    CANDIDATE: `${BASE_URL}/candidates`,
    RECRUITERS: `${BASE_URL}/recruiters`,
    LOCATION: `${BASE_URL}/locations`
};

//
// const PORTS = [5010, 5000];

// let BASE_URL = null;

// async function detectBackend() {
//     for (const port of PORTS) {
//         try {
//             const res = await fetch(`http://localhost:${port}/api/Jobs`);
//             if (res.ok) {
//                 BASE_URL = `http://localhost:${port}/api`;
//                 return BASE_URL;
//             }
//         } catch {
//             // Ignore errors and try the next port
//         }
//     }
//     throw new Error("Backend not found");
// }

// export async function getApiUrls() {
//     if (!BASE_URL) {
//         await detectBackend();
//     }

//     return {
//         JOBS: `${BASE_URL}/Jobs`,
//         COMPANIES: `${BASE_URL}/Companies`,
//         SEARCH: `${BASE_URL}/Search/jobs`,
//         USERS: `${BASE_URL}/Users`,
//         APPLICATIONS: `${BASE_URL}/Applications`
//     };
// }
//