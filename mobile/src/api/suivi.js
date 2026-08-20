import api from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WS_BASE_URL } from "./config";

// Suivis
export const listMySuivis = () => api.get("/suivis/mine").then((r) => r.data);
export const listSharedSuivis = () => api.get("/suivis/shared").then((r) => r.data);

export const createSuivi = (festivalId, lineupIds, name) =>
  api
    .post("/suivis", { festival_id: festivalId, lineup_ids: lineupIds, name: name || null })
    .then((r) => r.data);

export const getSuivi = (suiviId) => api.get(`/suivis/${suiviId}`).then((r) => r.data);

export const updateSuivi = (suiviId, { name, lineupIds } = {}) => {
  const payload = {};
  if (name !== undefined) payload.name = name || null;
  if (lineupIds !== undefined) payload.lineup_ids = lineupIds;
  return api.put(`/suivis/${suiviId}`, payload).then((r) => r.data);
};

export const deleteSuivi = (suiviId) => api.delete(`/suivis/${suiviId}`);

// Invitations
export const listSuiviInvitations = () => api.get("/suivis/invitations").then((r) => r.data);

export const acceptSuiviInvitation = (memberId) =>
  api.post(`/suivis/invitations/${memberId}/accept`).then((r) => r.data);

export const deleteSuiviInvitation = (memberId) =>
  api.delete(`/suivis/invitations/${memberId}`);

// Membres
export const listSuiviMembers = (suiviId) =>
  api.get(`/suivis/${suiviId}/members`).then((r) => r.data);

export const inviteSuiviMember = (suiviId, email) =>
  api.post(`/suivis/${suiviId}/invite`, { email }).then((r) => r.data);

// Programme agrégé
export const listSuiviSets = (suiviId) =>
  api.get(`/suivis/${suiviId}/sets`).then((r) => r.data);

// Positions live
export const listPositions = (suiviId) =>
  api.get(`/suivis/${suiviId}/positions`).then((r) => r.data);

export const setPosition = (suiviId, data) =>
  api.put(`/suivis/${suiviId}/position`, data).then((r) => r.data);

export const clearPosition = (suiviId) => api.delete(`/suivis/${suiviId}/position`);

export async function suiviWsUrl(suiviId) {
  const token = await AsyncStorage.getItem("access_token");
  return `${WS_BASE_URL}/suivis/${suiviId}/ws?token=${encodeURIComponent(token || "")}`;
}
