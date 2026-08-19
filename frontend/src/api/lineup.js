import axios from "axios";
import { API_BASE_URL as BASE } from "./config";

const authHeaders = () => {
  const activeToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
};

// Lineups
export const listMyLineups = async () => {
  const response = await axios.get(`${BASE}/lineups/mine`, { headers: authHeaders() });
  return response.data;
};

export const listSharedLineups = async () => {
  const response = await axios.get(`${BASE}/lineups/shared`, { headers: authHeaders() });
  return response.data;
};

export const createLineup = async (festivalId, name) => {
  const response = await axios.post(
    `${BASE}/lineups`,
    { festival_id: festivalId, name: name || null },
    { headers: authHeaders() },
  );
  return response.data;
};

export const getLineup = async (lineupId) => {
  const response = await axios.get(`${BASE}/lineups/${lineupId}`, { headers: authHeaders() });
  return response.data;
};

// Invitations
export const listInvitations = async () => {
  const response = await axios.get(`${BASE}/lineups/invitations`, { headers: authHeaders() });
  return response.data;
};

export const acceptInvitation = async (memberId) => {
  const response = await axios.post(
    `${BASE}/lineups/invitations/${memberId}/accept`,
    null,
    { headers: authHeaders() },
  );
  return response.data;
};

export const deleteInvitation = async (memberId) => {
  await axios.delete(`${BASE}/lineups/invitations/${memberId}`, { headers: authHeaders() });
};

// Membres
export const listMembers = async (lineupId) => {
  const response = await axios.get(`${BASE}/lineups/${lineupId}/members`, { headers: authHeaders() });
  return response.data;
};

export const inviteMember = async (lineupId, email) => {
  const response = await axios.post(
    `${BASE}/lineups/${lineupId}/invite`,
    { email },
    { headers: authHeaders() },
  );
  return response.data;
};

// Scènes (réutilisables au sein d'une lineup)
export const listStages = async (lineupId) => {
  const response = await axios.get(`${BASE}/lineups/${lineupId}/stages`, { headers: authHeaders() });
  return response.data;
};

export const createStage = async (lineupId, name) => {
  const response = await axios.post(
    `${BASE}/lineups/${lineupId}/stages`,
    { name },
    { headers: authHeaders() },
  );
  return response.data;
};

// Sets
export const listSets = async (lineupId) => {
  const response = await axios.get(`${BASE}/lineups/${lineupId}/sets`, { headers: authHeaders() });
  return response.data;
};

export const createSet = async (lineupId, data) => {
  const response = await axios.post(`${BASE}/lineups/${lineupId}/sets`, data, { headers: authHeaders() });
  return response.data;
};

export const updateSet = async (lineupId, setId, data) => {
  const response = await axios.put(
    `${BASE}/lineups/${lineupId}/sets/${setId}`,
    data,
    { headers: authHeaders() },
  );
  return response.data;
};

export const deleteSet = async (lineupId, setId) => {
  await axios.delete(`${BASE}/lineups/${lineupId}/sets/${setId}`, { headers: authHeaders() });
};
