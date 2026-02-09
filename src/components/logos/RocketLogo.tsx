const RocketLogo = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1">
      <span className="text-[#8B2F8B] text-xs font-bold tracking-wider uppercase">Rocket</span>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L14 8L10 6L6 8L10 2Z" fill="#8B2F8B"/>
        <path d="M6 8L10 18L14 8L10 12L6 8Z" fill="#D4145A"/>
      </svg>
    </div>
    <span className="text-[#8B2F8B] text-lg font-bold" style={{fontFamily: 'serif'}}>রকেট</span>
  </div>
);
export default RocketLogo;
