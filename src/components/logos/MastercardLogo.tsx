const MastercardLogo = () => (
  <div className="flex items-center relative w-10 h-8">
    <div className="w-7 h-7 rounded-full bg-[#EB001B] absolute left-0" />
    <div className="w-7 h-7 rounded-full bg-[#F79E1B] absolute right-0" />
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-white text-[5px] font-bold z-10 leading-none text-center">
      <span className="block">Master</span>
      <span className="block">Card</span>
    </div>
  </div>
);
export default MastercardLogo;
