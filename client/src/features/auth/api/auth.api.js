import apiClient from "../../../lib/apiClient.js";

export const authApi = {
  login(username, password) {
    return apiClient.post("/auth/login", { username, password }).then((r) => r.data);
  },
  signup(username, password) {
    return apiClient.post("/auth/signup", { username, password }).then((r) => r.data);
  },
};

export default authApi;
