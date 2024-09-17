export default function MenuZones({ navBarHeight }) {
  return (
    <div className="fixed top-0 w-full h-full bg-transparent">
      {/* LEFT ZONE */}
      <div
        className="absolute top-1/2 transform -translate-y-1/2 left-2 w-20 h-2/3 
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
      {/* RIGHT ZONE */}
      <div
        className="absolute top-1/2 transform -translate-y-1/2 right-2 w-20 h-2/3
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
      {/* TOP ZONE */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2  h-20 w-2/3
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
        style={{
          top: `${navBarHeight + 8}px`,
        }}
      ></div>
      {/* BOTTOM ZONE */}
      <div
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2  h-20 w-2/3
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
    </div>
  );
}
