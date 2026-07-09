export function RentasFauxMap() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[#E8DFD0] bg-gradient-to-br from-[#F5F0E8] to-[#E8E0D0]">
      <svg
        viewBox="0 0 400 150"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D4C8B8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="150" fill="url(#grid)" />
        
        {/* Abstract streets */}
        <path d="M 0 50 L 400 50" stroke="#C4B8A8" strokeWidth="3" />
        <path d="M 0 100 L 400 100" stroke="#C4B8A8" strokeWidth="3" />
        <path d="M 100 0 L 100 150" stroke="#C4B8A8" strokeWidth="3" />
        <path d="M 200 0 L 200 150" stroke="#C4B8A8" strokeWidth="3" />
        <path d="M 300 0 L 300 150" stroke="#C4B8A8" strokeWidth="3" />
        
        {/* Building blocks */}
        <rect x="20" y="60" width="60" height="30" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="120" y="20" width="50" height="20" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="220" y="60" width="40" height="25" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="320" y="20" width="55" height="25" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="40" y="110" width="45" height="25" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="140" y="110" width="50" height="20" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        <rect x="250" y="110" width="35" height="30" fill="#D8D0C0" stroke="#B8B0A0" strokeWidth="1" rx="2" />
        
        {/* Location pin */}
        <g transform="translate(200, 75)">
          <path
            d="M 0 0 C -12 0 -18 8 -18 18 C -18 32 0 48 0 48 C 0 48 18 32 18 18 C 18 8 12 0 0 0 Z"
            fill="#8B7355"
            stroke="#5C4A3A"
            strokeWidth="1.5"
          />
          <circle cx="0" cy="18" r="6" fill="#F5F0E8" />
        </g>
        
        {/* Decorative elements */}
        <circle cx="350" cy="130" r="3" fill="#C4B8A8" />
        <circle cx="50" cy="30" r="2" fill="#C4B8A8" />
        <circle cx="280" cy="35" r="2.5" fill="#C4B8A8" />
      </svg>
      <div className="absolute bottom-2 right-2 rounded bg-[#F5F0E8]/90 px-2 py-1 text-[10px] font-medium text-[#5C5346] backdrop-blur-sm">
        Map preview
      </div>
    </div>
  );
}
