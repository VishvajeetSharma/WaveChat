import usersRepository from "../users/users.repository.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAuthToken } from "../../utils/jwt.js";
import { AppError } from "../../errors/AppError.js";

export const authService = {
  async signup({ username, password }) {
    const existing = await usersRepository.findByUsername(username);
    if (existing) {
      throw AppError.conflict("That username is already taken");
    }

    const passwordHash = await hashPassword(password);
    const user = await usersRepository.create({ username, passwordHash });
    const token = signAuthToken(user);

    return { token, user: { id: user.id, username: user.username } };
  },

  async login({ username, password }) {
    const user = await usersRepository.findByUsername(username);
    if (!user) {
      throw AppError.unauthorized("Incorrect username or password");
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw AppError.unauthorized("Incorrect username or password");
    }

    await usersRepository.touchLastSeen(user.id);
    const token = signAuthToken(user);

    return { token, user: { id: user.id, username: user.username } };
  },
};

export default authService;
