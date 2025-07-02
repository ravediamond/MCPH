import React from "react";

interface CrateTagProps {
  tag: string;
  onClick: (tag: string) => void;
}

const CrateTag: React.FC<CrateTagProps> = ({ tag, onClick }) => {
  // Determine tag type/color based on prefix
  let tagClass = "bg-gray-100 text-gray-600"; // default style
  let displayTag = tag;

  // Handle different tag prefixes
  if (tag.startsWith("project:")) {
    tagClass = "bg-blue-100 text-blue-700";
    displayTag = tag.replace("project:", ""); // Remove prefix for cleaner display
  } else if (tag.startsWith("type:")) {
    tagClass = "bg-green-100 text-green-700";
    displayTag = tag.replace("type:", "");
  } else if (tag.startsWith("status:")) {
    tagClass = "bg-purple-100 text-purple-700";
    displayTag = tag.replace("status:", "");
  } else if (tag.startsWith("priority:")) {
    tagClass = "bg-red-100 text-red-700";
    displayTag = tag.replace("priority:", "");
  } else if (tag.startsWith("context:")) {
    tagClass = "bg-yellow-100 text-yellow-700";
    displayTag = tag.replace("context:", "");
  }

  return (
    <span
      className={`inline-flex items-center ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={() => onClick(tag)}
      title={`Search for ${tag}`}
    >
      {tag.includes(":") && (
        <span className="font-semibold mr-1">{tag.split(":")[0]}:</span>
      )}
      {displayTag}
    </span>
  );
};

export default CrateTag;
