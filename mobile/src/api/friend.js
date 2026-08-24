import api from "./client";

export const listFriends = () => api.get("/friends/mine").then((r) => r.data);
export const listFriendInvitations = () => api.get("/friends/invitations").then((r) => r.data);
export const addFriend = (email) => api.post("/friends", { email }).then((r) => r.data);
export const acceptFriend = (friendId) => api.post(`/friends/${friendId}/accept`).then((r) => r.data);
export const deleteFriend = (friendId) => api.delete(`/friends/${friendId}`);
