import api from "./axios";

export const registerUser = (data) =>
  api.post("/auth/register", data).then((r) => r.data);

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);

export const logoutUser = () => api.post("/auth/logout").then((r) => r.data);

export const getMe = () => api.get("/users/me").then((r) => r.data);
