export default function MenuZones({ navBarHeight }) {
  return (
    <div className="fixed w-screen h-screen bg-transparent">
      {/* LEFT ZONE */}
      <div
        className="fixed top-1/2 transform -translate-y-1/2 left-2 w-20 h-[500px] 
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
      {/* RIGHT ZONE */}
      <div
        className="fixed top-1/2 transform -translate-y-1/2 right-2 w-20 h-[500px] 
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
      {/* TOP ZONE */}
      <div
        className="fixed left-1/2 transform -translate-x-1/2  h-20 w-[500px] 
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
        style={{
          top: `${navBarHeight + 8}px`,
        }}
      ></div>
      {/* BOTTOM ZONE */}
      <div
        className="fixed bottom-2 left-1/2 transform -translate-x-1/2  h-20 w-[500px] 
      rounded-md bg-slate-300 border border-gray-900 border-dashed
      opacity-20 z-10
      "
      ></div>
    </div>
  );
}
