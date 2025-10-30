import logoSvg from "../assets/images/zoo-logo.svg";

export function ZooLogo({ className = "", size = 40 }) {
  return (
    <img
      src={logoSvg}
      alt="WildWood Zoo Logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
