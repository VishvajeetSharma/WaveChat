import { useTheme } from "../theme/ThemeContext.jsx";

export default function WaveMark({ size = 30, full = false, className = "" }) {
  const { theme } = useTheme();
  const src = full
    ? theme === "dark"
      ? "/logo/wavechat_logo_for_dark_bg.png"
      : "/logo/wavechat_logo_for_light_bg.png"
    : "/logo/wavechat_icon_transparent.png";

  return (
    <img
      className={`wave-mark${className ? ` ${className}` : ""}`}
      src={src}
      width={full ? size : size}
      height={full ? undefined : size}
      style={full ? { width: size, height: "auto" } : undefined}
      alt=""
      draggable="false"
    />
  );
}
