import React from "react";

interface CrateTagProps {
  tag: string;
  onClick: (tag: string) => void;
}

const CrateTag: React.FC<CrateTagProps> = ({ tag, onClick }) => {
  // Determine tag type/color based on prefix
  let tagClass = "bg-gray-100 text-gray-600"; // default style
  if (tag.startsWith("project:")) {
    tagClass = "bg-blue-100 text-blue-700";
  } else if (tag.startsWith("type:")) {
    tagClass = "bg-green-100 text-green-700";
  } else if (tag.startsWith("status:")) {
    tagClass = "bg-purple-100 text-purple-700";
  } else if (tag.startsWith("priority:")) {
    tagClass = "bg-red-100 text-red-700";
  } else if (tag.startsWith("context:")) {
    tagClass = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-block ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80`}
      onClick={() => onClick(tag)}
      title={`Search for ${tag}`}
    >
      {tag}
    </span>
  );
};

export default CrateTag;
