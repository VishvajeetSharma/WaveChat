import { initials } from "../utils/date.js";
import { avatarHue } from "../utils/avatar.js";

/** `online` omitted -> no presence dot. true/false -> green/grey dot. */
export default function Avatar({ name, size = "md", online }) {
  return (
    <div className={`avatar avatar-${size}`} style={{ "--h": avatarHue(name) }}>
      {initials(name)}
      {online !== undefined && <span className={`seal${online ? " online" : ""}`} />}
    </div>
  );
}
