import React from "react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const GeminiIcon = ({ size = 24, className, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={cn("text-indigo-500", className)}
      {...props}
    >
      <path d="M21.996 12.018a10.65 10.65 0 0 0-9.98 9.98h-.04c-.32-5.364-4.613-9.656-9.976-9.98v-.04c5.363-.32 9.656-4.613 9.98-9.976h.04c.324 5.363 4.617 9.656 9.98 9.98v.036z" />
    </svg>
  );
};

export const OpenAIIcon = ({ size = 24, className, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-emerald-600", className)}
      {...props}
    >
      <path d="M12.019 16.225L8.35 14.13m3.669 2.096l3.65-2.129m-3.65 2.13L9.183 17.88l-5.196-3a5 5 0 0 1-.714-.498m5.077-.252L5.5 12.5v-6q0-.444.075-.867m2.775 8.496l-.018-4.225m5.97-6.652a5.001 5.001 0 0 0-8.727 2.38m8.727-2.38a5 5 0 0 0-.789.369l-5.196 3l.015 3.283m5.97-6.652a5.001 5.001 0 0 1 6.425 6.367M5.575 5.633a5.001 5.001 0 0 0-2.302 8.748m8.708-6.606l3.669 2.096m-3.67-2.096L8.33 9.904m3.65-2.129l2.836-1.654l5.196 3q.384.223.714.498m-5.077.252L18.5 11.5v6q0 .444-.075.867M15.65 9.871l.018 4.225m-5.97 6.652a5.001 5.001 0 0 0 8.727-2.38m-8.727 2.38a5 5 0 0 0 .789-.369l5.196-3l-.015-3.283m-5.97 6.652a5.001 5.001 0 0 1-6.425-6.367m15.152 3.986a5.001 5.001 0 0 0 2.302-8.748" />
    </svg>
  );
};
