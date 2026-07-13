import usersRepository from "./users.repository.js";

export const usersService = {
  async listContactsFor(userId) {
    return usersRepository.listForSidebar(userId);
  },
};

export default usersService;
