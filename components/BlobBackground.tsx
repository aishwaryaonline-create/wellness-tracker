"use client";

export default function BlobBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top-right blob */}
      <div
        className="blob-animate absolute -top-24 -right-24 w-80 h-80 opacity-90"
        style={{ willChange: "transform" }}
      >
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blobGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E91E8C" />
              <stop offset="100%" stopColor="#FF6B6B" />
            </linearGradient>
          </defs>
          <path
            d="M320,180 C340,120 310,60 260,40 C210,20 150,50 110,100 C70,150 60,220 90,270 C120,320 190,350 250,340 C310,330 300,240 320,180 Z"
            fill="url(#blobGrad1)"
          />
        </svg>
      </div>

      {/* Bottom-left blob */}
      <div
        className="blob-animate-slow absolute -bottom-20 -left-20 w-72 h-72 opacity-80"
        style={{ willChange: "transform" }}
      >
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blobGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFAB76" />
              <stop offset="100%" stopColor="#FF6BB5" />
            </linearGradient>
          </defs>
          <path
            d="M80,220 C60,280 90,340 140,360 C190,380 250,350 290,300 C330,250 340,180 310,130 C280,80 210,50 150,60 C90,70 100,160 80,220 Z"
            fill="url(#blobGrad2)"
          />
        </svg>
      </div>

      {/* Top-left tiny accent */}
      <div className="blob-animate absolute top-1/3 -left-10 w-32 h-32 opacity-40">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M100,40 C130,30 160,60 160,100 C160,140 130,170 100,160 C70,150 40,120 40,90 C40,60 70,50 100,40 Z"
            fill="#E91E8C"
          />
        </svg>
      </div>
    </div>
  );
}
