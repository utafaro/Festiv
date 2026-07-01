import axios from "axios";

export const createFestival = async (festivalTextData, imageFile) => {
  const formData = new FormData();

  // 1. On sérialise l'objet contenant les infos textuelles du festival en JSON string
  formData.append("festival_data", JSON.stringify(festivalTextData));

  // 2. On ajoute le fichier s'il a été sélectionné
  if (imageFile) {
    formData.append("file", imageFile);
  }
  const activeToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  try {
    const response = await axios.post(
      "http://localhost:8000/festivals",
      formData,
      {
        headers: {
          // Très important : indique au navigateur de formater correctement la requête
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${activeToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la création du festival :",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const updateFestival = async (
  festivalId,
  festivalTextData,
  imageFile,
) => {
  const formData = new FormData();
  formData.append("festival_data", JSON.stringify(festivalTextData));
  if (imageFile) {
    formData.append("file", imageFile);
  }

  const activeToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  try {
    const response = await axios.put(
      `http://localhost:8000/festivals/${festivalId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: activeToken ? `Bearer ${activeToken}` : undefined,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la modification du festival :",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getFestivalById = async (festivalId) => {
  const activeToken =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  try {
    const response = await axios.get(
      `http://localhost:8000/festivals/${festivalId}`,
      {
        headers: {
          Authorization: activeToken ? `Bearer ${activeToken}` : undefined,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du festival :",
      error.response?.data || error.message,
    );
    throw error;
  }
};
