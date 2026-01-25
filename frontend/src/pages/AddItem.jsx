import React, { useState } from 'react'
import { IoIosArrowBack } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CiForkAndKnife } from "react-icons/ci";
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const serverUrl = import.meta.env.VITE_SERVER_URL;

const AddItem = () => {
    const navigate = useNavigate();
    const { myShopData } = useSelector(state => state.owner);

    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [frontendImage, setFrontendImage] = useState(null);
    const [backendImage, setBackendImage] = useState(null);
    const categories = ["Snacks",
        "Main Course",
        "Desserts",
        "Pizza",
        "Burgers",
        "Sandwiches",
        "South Indian",
        "North Indian",
        "Chinese",
        "Fast Food",
        "Others"]
    const [category, setCategory] = useState("")
    const [foodType, setFoodType] = useState("veg")
    const [loading, setLoading] = useState(false)

    const handleImage = (e) => {
        const file = e.target.files[0];
        setBackendImage(file);
        setFrontendImage(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)

        if (!category) {
            alert("Please select a category");
            return;
        }

        if (!name.trim()) {
            alert("Please enter food name");
            return;
        }

        if (price <= 0) {
            alert("Please enter valid price");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", Number(price));

            if (backendImage) {
                formData.append("image", backendImage);
            }

            const result = await axios.post(
                `${serverUrl}/api/item/add-item`,
                formData,
                { withCredentials: true }
            );

            setLoading(false)
            navigate("/");
        } catch (error) {
            console.log(error.response?.data || error.message);
            setLoading(false)
        }
    };


    return (
        <div className='flex justify-center flex-col items-center p-6 min-h-screen'>
            <div onClick={() => navigate("/")}>
                <IoIosArrowBack size={35} />
            </div>

            <div className='max-w-lg w-full bg-white p-8'>
                <div className='flex flex-col items-center mb-6'>
                    <CiForkAndKnife size={50} />
                    <h2>Add Food</h2>
                </div>

                {myShopData && (
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden mb-6">
                        <img
                            src={myShopData.image}
                            alt={myShopData.name}
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-4 text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {myShopData.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Add new food item for this shop
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-lg bg-white p-6 rounded-xl shadow-lg">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Food Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter Food name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Food Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="pl-7 w-full px-4 py-2 border rounded-lg"
                            />
                        </div>


                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Category
                        </label>
                        <select

                            value={category}
                            onChange={(e) => setCategory(e.target.value)}

                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Select Category</option>
                            {categories.map((cate, index) => (
                                <option value={cate} key={index}>{cate}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Food Type
                        </label>
                        <select

                            value={foodType}
                            onChange={(e) => setFoodType(e.target.value)}

                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >

                            <option value="veg">Veg</option>
                            <option value="non veg">Non-Veg</option>


                        </select>
                    </div>
                    {frontendImage && (
                        <img
                            src={frontendImage}
                            className="w-full h-40 object-cover rounded-lg border"
                        />
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#ff4d2d] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition" disabled={loading}
                    >
                        {loading ? <ClipLoader size={20} color='white'/>:"Save"}
                    </button>

                </form>

            </div>
        </div>
    );
};

export default AddItem;
