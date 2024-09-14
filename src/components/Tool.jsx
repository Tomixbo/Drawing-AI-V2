import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Tool({
  iconTool,
  nameTool,
  iconSize,
  activeTool,
  handleFunction,
}) {
  return (
    <button
      className={`h-[${iconSize}px] w-[${iconSize}px] 
                ${
                  activeTool === nameTool
                    ? "rounded-full bg-cyan-950 dark:bg-teal-300 transition-all duration-200 ease-in-out"
                    : "rounded-md bg-white border border-gray-300 dark:border-gray-700  hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700  "
                }
                p-1 flex items-center justify-center 
                       
                shadow-md dark:shadow-none`}
      onClick={handleFunction}
    >
      <FontAwesomeIcon
        icon={iconTool}
        className={`${
          activeTool === nameTool
            ? "text-teal-300 dark:text-cyan-950"
            : "text-gray-700 dark:text-gray-200"
        }`}
        style={{ fontSize: iconSize * 0.5 }}
      />
      {/* {isMaximized && <span className="mx-2 text-white">nameTool</span>} */}
    </button>
  );
}
