import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Crucial for session cookies
});

export default apiClient;
