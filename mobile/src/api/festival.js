import api from "./client";

export const listFestivals = () => api.get("/festivals").then((r) => r.data);

export const getFestivalById = (festivalId) =>
  api.get(`/festivals/${festivalId}`).then((r) => r.data);

// imageAsset: { uri, name, type } depuis expo-image-picker, ou null
export const createFestival = (festivalTextData, imageAsset) => {
  const formData = new FormData();
  formData.append("festival_data", JSON.stringify(festivalTextData));
  if (imageAsset) {
    formData.append("file", {
      uri: imageAsset.uri,
      name: imageAsset.name || "cover.jpg",
      type: imageAsset.type || "image/jpeg",
    });
  }
  return api
    .post("/festivals", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const updateFestival = (festivalId, festivalTextData, imageAsset) => {
  const formData = new FormData();
  formData.append("festival_data", JSON.stringify(festivalTextData));
  if (imageAsset) {
    formData.append("file", {
      uri: imageAsset.uri,
      name: imageAsset.name || "cover.jpg",
      type: imageAsset.type || "image/jpeg",
    });
  }
  return api
    .put(`/festivals/${festivalId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
