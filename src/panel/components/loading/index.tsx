import React from "react";

const LineLoading: React.FC<{
  size?: number;
  color?: string;
  gap?: number;
}> = ({ size = 8, color = "#e6e6e6", gap = 6 }) => {
  return (
    <div className="flex items-end">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="dot"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: "50%",
            marginLeft: i === 0 ? 0 : gap,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      <style>{`
        .dot {
          display: inline-block;
          animation: bounce 0.6s infinite ease-in-out;
        }

        @keyframes bounce {
          0% {
            transform: translateY(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-6px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default LineLoading;