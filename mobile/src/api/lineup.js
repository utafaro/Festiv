import api from "./client";

// Lineups
export const listMyLineups = () => api.get("/lineups/mine").then((r) => r.data);
export const listSharedLineups = () => api.get("/lineups/shared").then((r) => r.data);

export const createLineup = (festivalId, name) =>
  api
    .post("/lineups", { festival_id: festivalId, name: name || null })
    .then((r) => r.data);

export const getLineup = (lineupId) => api.get(`/lineups/${lineupId}`).then((r) => r.data);

// Invitations
export const listInvitations = () => api.get("/lineups/invitations").then((r) => r.data);

export const acceptInvitation = (memberId) =>
  api.post(`/lineups/invitations/${memberId}/accept`).then((r) => r.data);

export const deleteInvitation = (memberId) =>
  api.delete(`/lineups/invitations/${memberId}`);

// Membres
export const listMembers = (lineupId) =>
  api.get(`/lineups/${lineupId}/members`).then((r) => r.data);

export const inviteMember = (lineupId, email) =>
  api.post(`/lineups/${lineupId}/invite`, { email }).then((r) => r.data);

// Scènes
export const listStages = (lineupId) =>
  api.get(`/lineups/${lineupId}/stages`).then((r) => r.data);

export const createStage = (lineupId, name) =>
  api.post(`/lineups/${lineupId}/stages`, { name }).then((r) => r.data);

// Sets
export const listSets = (lineupId) =>
  api.get(`/lineups/${lineupId}/sets`).then((r) => r.data);

export const createSet = (lineupId, data) =>
  api.post(`/lineups/${lineupId}/sets`, data).then((r) => r.data);

export const updateSet = (lineupId, setId, data) =>
  api.put(`/lineups/${lineupId}/sets/${setId}`, data).then((r) => r.data);

export const deleteSet = (lineupId, setId) =>
  api.delete(`/lineups/${lineupId}/sets/${setId}`);
