export function ZooLogo({ className = "", size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Tree trunk */}
      <rect x="42" y="50" width="16" height="30" fill="#8B4513" rx="2" />

      {/* Tree foliage - layered circles to create a tree crown */}
      <circle cx="50" cy="45" r="20" fill="#2D5016" />
      <circle cx="38" cy="40" r="16" fill="#3A6B1F" />
      <circle cx="62" cy="40" r="16" fill="#3A6B1F" />
      <circle cx="50" cy="30" r="18" fill="#4CAF50" />

      {/* Animal paw print on tree */}
      <ellipse cx="50" cy="35" rx="4" ry="5" fill="#FFD700" />
      <circle cx="47" cy="30" r="2" fill="#FFD700" />
      <circle cx="53" cy="30" r="2" fill="#FFD700" />
      <circle cx="46" cy="26" r="1.5" fill="#FFD700" />
      <circle cx="54" cy="26" r="1.5" fill="#FFD700" />

      {/* Circular background */}
      <circle
        cx="50"
        cy="50"
        r="48"
        stroke="#4CAF50"
        strokeWidth="3"
        fill="none"
      />

      {/* Small leaves accent */}
      <path d="M 30 55 Q 28 50 30 48 Q 32 50 30 55" fill="#4CAF50" />
      <path d="M 70 55 Q 72 50 70 48 Q 68 50 70 55" fill="#4CAF50" />
    </svg>
  );
}
