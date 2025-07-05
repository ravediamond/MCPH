import React from "react";

interface CrateTagProps {
  tag: string;
  onClick: (tag: string) => void;
}

const CrateTag: React.FC<CrateTagProps> = ({ tag, onClick }) => {
  // Use the default style for all tags as predefined tags are removed
  let tagClass = "bg-gray-100 text-gray-600";

  // Check if the tag contains a colon
  if (tag.includes(":")) {
    const [prefix, value] = tag.split(":", 2);

    return (
      <span
        className={`inline-flex items-center ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={() => onClick(tag)}
        title={`Search for ${tag}`}
      >
        <span className="font-semibold">{prefix}:</span>{value}
      </span>
    );
  }

  // For tags without a colon
  return (
    <span
      className={`inline-flex items-center ${tagClass} text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={() => onClick(tag)}
      title={`Search for ${tag}`}
    >
      {tag}
    </span>
  );
};

export default CrateTag;
