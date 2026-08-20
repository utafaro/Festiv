import axios from "axios";
import { API_BASE_URL as BASE, WS_BASE_URL } from "./config";

const getToken = () =>
  localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Suivis
export const listMySuivis = async () => {
  const response = await axios.get(`${BASE}/suivis/mine`, { headers: authHeaders() });
  return response.data;
};

export const listSharedSuivis = async () => {
  const response = await axios.get(`${BASE}/suivis/shared`, { headers: authHeaders() });
  return response.data;
};

export const createSuivi = async (festivalId, lineupIds, name) => {
  const response = await axios.post(
    `${BASE}/suivis`,
    { festival_id: festivalId, lineup_ids: lineupIds, name: name || null },
    { headers: authHeaders() },
  );
  return response.data;
};

export const getSuivi = async (suiviId) => {
  const response = await axios.get(`${BASE}/suivis/${suiviId}`, { headers: authHeaders() });
  return response.data;
};

export const updateSuivi = async (suiviId, { name, lineupIds } = {}) => {
  const payload = {};
  if (name !== undefined) payload.name = name || null;
  if (lineupIds !== undefined) payload.lineup_ids = lineupIds;
  const response = await axios.put(`${BASE}/suivis/${suiviId}`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const deleteSuivi = async (suiviId) => {
  await axios.delete(`${BASE}/suivis/${suiviId}`, { headers: authHeaders() });
};

// Invitations
export const listSuiviInvitations = async () => {
  const response = await axios.get(`${BASE}/suivis/invitations`, { headers: authHeaders() });
  return response.data;
};

export const acceptSuiviInvitation = async (memberId) => {
  const response = await axios.post(
    `${BASE}/suivis/invitations/${memberId}/accept`,
    null,
    { headers: authHeaders() },
  );
  return response.data;
};

export const deleteSuiviInvitation = async (memberId) => {
  await axios.delete(`${BASE}/suivis/invitations/${memberId}`, { headers: authHeaders() });
};

// Membres
export const listSuiviMembers = async (suiviId) => {
  const response = await axios.get(`${BASE}/suivis/${suiviId}/members`, { headers: authHeaders() });
  return response.data;
};

export const inviteSuiviMember = async (suiviId, email) => {
  const response = await axios.post(
    `${BASE}/suivis/${suiviId}/invite`,
    { email },
    { headers: authHeaders() },
  );
  return response.data;
};

// Programme agrégé (sets de toutes les lineups du suivi)
export const listSuiviSets = async (suiviId) => {
  const response = await axios.get(`${BASE}/suivis/${suiviId}/sets`, { headers: authHeaders() });
  return response.data;
};

// Positions live
export const listPositions = async (suiviId) => {
  const response = await axios.get(`${BASE}/suivis/${suiviId}/positions`, { headers: authHeaders() });
  return response.data;
};

export const setPosition = async (suiviId, data) => {
  const response = await axios.put(`${BASE}/suivis/${suiviId}/position`, data, {
    headers: authHeaders(),
  });
  return response.data;
};

export const clearPosition = async (suiviId) => {
  await axios.delete(`${BASE}/suivis/${suiviId}/position`, { headers: authHeaders() });
};

export const suiviWsUrl = (suiviId) => {
  const token = getToken();
  return `${WS_BASE_URL}/suivis/${suiviId}/ws?token=${encodeURIComponent(token || "")}`;
};
