import apiClient from "../../../lib/apiClient.js";

export const chatApi = {
  getContacts() {
    return apiClient.get("/users").then((r) => r.data.users);
  },
  getConversation(userId) {
    return apiClient.get(`/messages/${userId}`).then((r) => r.data.messages);
  },
};

export default chatApi;
