import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import MenuModal from "./MenuModal";

const NavBar = React.forwardRef(({ setDarkMode, darkMode }, ref) => {
  const [activeTab, setActiveTab] = useState("CREATE");
  const [underlinePosition, setUnderlinePosition] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const menuItems = [
    { name: "CREATE" },
    { name: "MODIFY" },
    { name: "UPSCALE" },
    { name: "DEV. OPTIONS" },
  ];

  const menuRefs = useRef([]);

  // Function to update the underline position and width
  const updateUnderline = () => {
    const currentIndex = menuItems.findIndex((item) => item.name === activeTab);
    if (menuRefs.current[currentIndex]) {
      setUnderlinePosition(menuRefs.current[currentIndex].offsetLeft);
      setUnderlineWidth(menuRefs.current[currentIndex].offsetWidth);
    }
  };

  // Initial update of the underline on mount
  useEffect(() => {
    // Delay the updateUnderline to ensure refs are populated
    setTimeout(() => {
      updateUnderline();
    }, 0);
  }, []); // Run this effect only once on mount

  // Update underline position based on active tab and window resize
  useEffect(() => {
    updateUnderline(); // Update underline when activeTab changes

    // Add event listener for window resize
    window.addEventListener("resize", updateUnderline);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", updateUnderline);
    };
  }, [activeTab]); // Run this effect when activeTab changes

  return (
    <>
      <nav ref={ref} className="bg-white dark:bg-gray-800 w-full ">
        <div className="relative max-w-full mx-auto px-0 sm:px-0 lg:px-0 shadow-md z-50">
          <div className="flex justify-between mx-2 h-10 items-center">
            <img src={`/logo192.png`} alt="logo" className="h-8 w-auto ml-2" />
            <div className="flex flex-1 items-center h-full space-x-0 ml-4 relative ">
              {menuItems.map((item, index) => (
                <button
                  key={item.name}
                  ref={(el) => (menuRefs.current[index] = el)}
                  onClick={() => setActiveTab(item.name)}
                  className={`${
                    activeTab === item.name
                      ? "bg-blue-50 dark:bg-gray-800 text-cyan-900 dark:text-cyan-500 text-xs md:text-base font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs md:text-sm"
                  } h-full px-2 md:px-6 py-2 font-mono font-medium transition-all duration-300 ease-in-out `}
                  style={{ flex: 1 }}
                >
                  {/* If the item is "DEV. OPTIONS", show a different text for small screens */}
                  {item.name === "DEV. OPTIONS" ? (
                    <>
                      <span className="block md:hidden">DEV.OPT</span>{" "}
                      {/* Small screen text */}
                      <span className="hidden md:block">{item.name}</span>{" "}
                      {/* Large screen text */}
                    </>
                  ) : (
                    item.name
                  )}
                </button>
              ))}

              {/* Animated underline */}
              <div
                className="absolute bottom-0 h-1 bg-cyan-500 dark:bg-cyan-500 transition-all duration-300 ease-in-out"
                style={{
                  width: underlineWidth,
                  transform: `translateX(${underlinePosition}px)`,
                }}
              />
            </div>
            <div className="ml-4 mx-2">
              <button
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                onClick={() => setIsModalOpen(true)}
              >
                <FontAwesomeIcon
                  icon={faGear}
                  className="text-gray-600 dark:text-gray-300 text-lg"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <MenuModal
          onClose={() => setIsModalOpen(false)}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          isDarkMode={darkMode}
        />
      )}
    </>
  );
});

export default NavBar;
