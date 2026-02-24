import React from "react";

const CategoryCard = ({ data, onClick }) => {
  console.log("CARD DATA 👉", data);

  const title = data?.category || data?.name || "No Name";

  let imageUrl = "";

  if (typeof data?.image === "string") {
    imageUrl = data.image;
  } else if (typeof data?.image === "object") {
    imageUrl = data.image?.url || "";
  }
  
  return (
    <div className="w-[160px] h-[180px] rounded-2xl border-2 border-[#ff4d2d]
    shrink-0 overflow-hidden bg-white shadow-lg relative" onClick={onClick}>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-[140px] object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-[140px] flex items-center justify-center text-gray-400 text-sm">
          NO IMAGE
        </div>
      )}

      <div className="h-[40px] flex items-center justify-center text-sm font-semibold bg-white">
        {title}
      </div>
    </div>
  );
};

export default CategoryCard;
