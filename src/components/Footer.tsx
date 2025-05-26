import React from "react";

const Footer: React.FC = () => (
  <footer className="bg-gray-200 text-center py-2 mt-4 text-sm">
    &copy; {new Date().getFullYear()} Scoreboard App
  </footer>
);

export default Footer;