import React from "react";
import { ZooLogo } from "../ZooLogo";

export default function LoadingWithIcon({
  text = "Loading...",
  size = 64,
  className = "",
  imgClassName = "",
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto">
        <ZooLogo size={size} className={`mx-auto ${imgClassName}`} />
      </div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );
}
