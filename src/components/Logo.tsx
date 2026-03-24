interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
};

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 2h14l8 8v20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
          fill="#4A7C6F"
        />
        <path d="M20 2l8 8h-6a2 2 0 0 1-2-2V2z" fill="#5B8A72" />
        <rect
          x="9"
          y="14"
          width="14"
          height="1.5"
          rx="0.75"
          fill="white"
          opacity="0.9"
        />
        <rect
          x="9"
          y="18"
          width="11"
          height="1.5"
          rx="0.75"
          fill="white"
          opacity="0.7"
        />
        <rect
          x="9"
          y="22"
          width="13"
          height="1.5"
          rx="0.75"
          fill="white"
          opacity="0.5"
        />
      </svg>
      {showText && (
        <span className={`${text} font-semibold tracking-tight text-[#2D3436]`}>
          Prop<span className="text-[#4A7C6F]">Build</span>
        </span>
      )}
    </div>
  );
}
