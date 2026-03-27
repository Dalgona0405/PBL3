
const BASE_URL = 'http://localhost:5010/api';

export const API_URLS = {
    JOBS: `${BASE_URL}/Jobs`,
    COMPANIES: `${BASE_URL}/Companies`,
    SEARCH: `${BASE_URL}/Search/jobs`,
    USERS: `${BASE_URL}/Users`,
    APPLICATIONS: `${BASE_URL}/Applications`
};
/*
const PORTS = [5010, 5000];

let BASE_URL = null;

async function detectBackend() {
    for (const port of PORTS) {
        try {
            const res = await fetch(`http://localhost:${port}/api/Jobs`);
            if (res.ok) {
                BASE_URL = `http://localhost:${port}/api`;
                return BASE_URL;
            }
        } catch {
            // Ignore errors and try the next port
        }
    }
    throw new Error("Backend not found");
}

export async function getApiUrls() {
    if (!BASE_URL) {
        await detectBackend();
    }

    return {
        JOBS: `${BASE_URL}/Jobs`,
        COMPANIES: `${BASE_URL}/Companies`,
        SEARCH: `${BASE_URL}/Search/jobs`,
        USERS: `${BASE_URL}/Users`,
        APPLICATIONS: `${BASE_URL}/Applications`
    };
}
*/