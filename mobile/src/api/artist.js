import api from "./client";

export const listArtists = () => api.get("/artists").then((r) => r.data);

export const createArtist = (data) => api.post("/artists", data).then((r) => r.data);
