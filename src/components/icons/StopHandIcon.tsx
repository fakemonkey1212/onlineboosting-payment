interface StopHandIconProps {
  className?: string;
  color?: string;
}

const StopHandIcon = ({ className = "w-10 h-10", color = "currentColor" }: StopHandIconProps) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Four fingers - vertical lines with rounded tops */}
    {/* Index finger */}
    <path d="M16 22V10C16 8.5 17 7.5 18 7.5C19 7.5 20 8.5 20 10V22" />
    
    {/* Middle finger */}
    <path d="M22 22V8C22 6.5 23 5.5 24 5.5C25 5.5 26 6.5 26 8V22" />
    
    {/* Ring finger */}
    <path d="M28 22V10C28 8.5 29 7.5 30 7.5C31 7.5 32 8.5 32 10V22" />
    
    {/* Pinky finger */}
    <path d="M34 22V14C34 12.5 35 11.5 36 11.5C37 11.5 38 12.5 38 14V22" />
    
    {/* Palm outline - connects all fingers and curves down */}
    <path d="M14 22H38V30C38 38 32 42 26 42H22C16 42 10 38 10 30V26" />
    
    {/* Thumb - angled on the left */}
    <path d="M14 22V26C14 26 14 28 12 28C10 28 8 26 8 24V20C8 18 9 16 11 16C13 16 14 18 14 20V22" />
  </svg>
);

export default StopHandIcon;
