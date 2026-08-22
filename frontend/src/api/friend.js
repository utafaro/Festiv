import axios from "axios";
import { API_BASE_URL as BASE } from "./config";

const getToken = () =>
  localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const listFriends = async () => {
  const response = await axios.get(`${BASE}/friends/mine`, { headers: authHeaders() });
  return response.data;
};

export const listFriendInvitations = async () => {
  const response = await axios.get(`${BASE}/friends/invitations`, { headers: authHeaders() });
  return response.data;
};

export const addFriend = async (email) => {
  const response = await axios.post(`${BASE}/friends`, { email }, { headers: authHeaders() });
  return response.data;
};

export const acceptFriend = async (friendId) => {
  const response = await axios.post(
    `${BASE}/friends/${friendId}/accept`,
    null,
    { headers: authHeaders() },
  );
  return response.data;
};

export const deleteFriend = async (friendId) => {
  await axios.delete(`${BASE}/friends/${friendId}`, { headers: authHeaders() });
};
