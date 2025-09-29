import logo from "./logo.png";

interface LogoProps {
  width: number;
  className?: string;
}

export const Logo = ({ width, className = "" }: LogoProps) => {
  return (
    <img
      src={logo}
      alt="blit.cc logo"
      width={width}
      className={`logo ${className}`}
    />
  );
};

export default Logo;
