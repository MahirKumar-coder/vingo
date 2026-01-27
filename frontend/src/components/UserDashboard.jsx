import React, { useEffect, useRef, useState } from "react";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import { CiCircleChevLeft, CiCircleChevRight } from "react-icons/ci";
import { useSelector } from "react-redux";
import FoodCard from "./FoodCard";

const UserDashboard = () => {
  // ✅ SAFE REDUX DATA
  const currentCity =
    useSelector((state) => state?.user?.currentCity) || "your city";

  const shopInMyCity =
    useSelector((state) => state?.user?.shopInMyCity) || [];

  const itemsInMyCity = useSelector((state) => state?.user?.itemsInMyCity) || [];

  const cateRef = useRef(null);
  const shopRef = useRef(null);

  const [cateBtn, setCateBtn] = useState({ left: false, right: false });
  const [shopBtn, setShopBtn] = useState({ left: false, right: false });

  const updateButtons = (ref, setBtn) => {
    const el = ref.current;
    if (!el) return;

    setBtn({
      left: el.scrollLeft > 0,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
    });
  };

  const scroll = (ref, dir) => {
    ref.current?.scrollBy({
      left: dir === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateButtons(cateRef, setCateBtn);
    updateButtons(shopRef, setShopBtn);

    const cateScroll = () => updateButtons(cateRef, setCateBtn);
    const shopScroll = () => updateButtons(shopRef, setShopBtn);

    cateRef.current?.addEventListener("scroll", cateScroll);
    shopRef.current?.addEventListener("scroll", shopScroll);

    return () => {
      cateRef?.current?.removeEventListener("scroll", cateScroll);
      shopRef?.current?.removeEventListener("scroll", shopScroll);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-14 px-4">

      {/* CATEGORY SLIDER */}
      <section className="relative">
        <h1 className="text-2xl sm:text-3xl text-center mb-4">
          Inspiration for your next order
        </h1>

        {cateBtn.left && (
          <button
            onClick={() => scroll(cateRef, "left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full z-10"
          >
            <CiCircleChevLeft />
          </button>
        )}

        <div
          ref={cateRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-8"
        >
          {categories.map((c, i) => (
            <CategoryCard key={i} data={c} />
          ))}
        </div>

        {cateBtn.right && (
          <button
            onClick={() => scroll(cateRef, "right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full z-10"
          >
            <CiCircleChevRight />
          </button>
        )}
      </section>

      {/* SHOP SLIDER */}
      <section className="relative">
        <h1 className="text-2xl sm:text-3xl mb-4">
          Best Shops in {currentCity}
        </h1>

        {shopBtn.left && (
          <button
            onClick={() => scroll(shopRef, "left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full z-10"
          >
            <CiCircleChevLeft />
          </button>
        )}

        <div
          ref={shopRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-8"
        >
          {shopInMyCity.map((shop, i) => {
            console.log("SHOP DATA 👉", shop);   // 👈 YEH LINE ADD KAR
            return <CategoryCard key={i} data={shop} />;
          })}
        </div>


        {shopBtn.right && (
          <button
            onClick={() => scroll(shopRef, "right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full z-10"
          >
            <CiCircleChevRight />
          </button>
        )}
      </section>

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Suggested Food Items
        </h1>

        <div className="w-full h-auto flex flex-wrap gap-[20px] justify-center">
          {itemsInMyCity?.map((item, index) => (
            <FoodCard key={index} data={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
