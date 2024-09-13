import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
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

  // Update underline position based on active tab
  useEffect(() => {
    const currentIndex = menuItems.findIndex((item) => item.name === activeTab);
    if (menuRefs.current[currentIndex]) {
      setUnderlinePosition(menuRefs.current[currentIndex].offsetLeft);
      setUnderlineWidth(menuRefs.current[currentIndex].offsetWidth);
    }
  }, [activeTab]);

  return (
    <>
      <nav
        ref={ref} // Attach ref for dynamic height measurement
        className="bg-white dark:bg-gray-900 shadow-md w-full"
      >
        <div className="relative max-w-full mx-auto px-0 sm:px-0 lg:px-0">
          <div className="flex justify-between mx-2 h-10 items-center">
            {" "}
            {/* Hauteur rétablie à 10 */}
            {/* Logo */}
            <img src={`/logo192.png`} alt="logo" className="h-8 w-auto ml-2" />
            {/* Menu Items */}
            <div className="flex flex-1 items-center h-full space-x-0 ml-4 relative">
              {menuItems.map((item, index) => (
                <button
                  key={item.name}
                  ref={(el) => (menuRefs.current[index] = el)}
                  onClick={() => setActiveTab(item.name)}
                  className={`${
                    activeTab === item.name
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  } h-full px-6 py-2 text-sm font-medium transition-all duration-300 ease-in-out`}
                  style={{ flex: 1 }}
                >
                  {item.name}
                </button>
              ))}
              {/* Animated underline */}
              <div
                className="absolute bottom-0 h-1 bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-in-out"
                style={{
                  width: underlineWidth,
                  transform: `translateX(${underlinePosition}px)`,
                }}
              />
            </div>
            {/* Settings Icon Button */}
            <div className="ml-4 mx-2">
              <button
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                onClick={() => setIsModalOpen(true)}
              >
                <FontAwesomeIcon
                  icon={faCog}
                  className="text-gray-600 dark:text-gray-300 text-lg"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Render the modal if open */}
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
