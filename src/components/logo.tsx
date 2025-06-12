import type { ComponentType } from "react";
import logo from "./logo.png";

export const Logo: ComponentType<{
  width: number;
  className: string;
}> = ({ width, className }) => {
  return (
    <img
      src={logo}
      // formats={["webp", "png"]}
      alt=""
      width={width}
      // quality="max"
      // densities={[1.5, 2, 3]}
      className={`logo ${className}`}
    />
  );
};
