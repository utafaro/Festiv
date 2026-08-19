import axios from "axios";
import { API_BASE_URL } from "./config";

const authHeaders = () => {
  const activeToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
};

export const listArtists = async () => {
  const response = await axios.get(`${API_BASE_URL}/artists`);
  return response.data;
};

export const createArtist = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/artists`, data, {
    headers: authHeaders(),
  });
  return response.data;
};
