import usersService from "./users.service.js";

export const usersController = {
  async list(req, res) {
    const users = await usersService.listContactsFor(req.user.id);
    res.json({ users });
  },
};

export default usersController;
