import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

// ✅ Helper Function (Ab hum iska use karenge)
const cleanValue = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === "undefined" ||
        value === "null" ||
        (typeof value === "string" && value.trim() === "")
    ) {
        return undefined; // Mongoose undefined fields ko ignore kar deta hai
    }
    return value.trim();
};

export const createEditShop = async (req, res) => {
    try {
        // ✅ Fix: cleanValue ka use kiya
        const name = cleanValue(req.body.name);
        const city = cleanValue(req.body.city);
        const state = cleanValue(req.body.state);
        const address = cleanValue(req.body.address);

        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path);
        }

        // Payload object banaya
        const payload = {
            owner: req.userId,
        };

        // Sirf wahi fields add karo jo defined hain
        if (name) payload.name = name;
        if (city) payload.city = city;
        if (state) payload.state = state;
        if (address) payload.address = address;
        if (image) payload.image = image;

        let shop = await Shop.findOne({ owner: req.userId });

        if (!shop) {
            // Create New Shop
            shop = await Shop.create(payload);
        } else {
            // Update Existing Shop
            shop = await Shop.findByIdAndUpdate(
                shop._id,
                payload,
                { new: true, runValidators: true } // runValidators zaroori hai update ke waqt validation ke liye
            );
        }

        // ✅ Populate Owner & Items
        await shop.populate([
            { path: "owner", select: "-password" }, // Password hide kar diya security ke liye
            {
                path: "items",
                options: { sort: { updatedAt: -1 } }
            }
        ]);

        return res.status(200).json(shop);

    } catch (error) {
        console.error("❌ Create/Edit Shop Error:", error);
        return res.status(500).json({
            message: "Failed to create or edit shop",
            error: error.message
        });
    }
};

export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId })
            .populate({ path: "owner", select: "-password" }) // Password mat bhejo
            .populate({ path: "items", options: { sort: { updatedAt: -1 } } }); // Items ko sort karo

        if (!shop) {
            return res.status(200).json(null); // Agar shop nahi hai to null bhejo (Frontend handle karega)
        }

        return res.status(200).json(shop);
    } catch (error) {
        console.error("❌ Get My Shop Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const getShopByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const cleanedCity = cleanValue(city);

        if (!cleanedCity) {
            return res.status(400).json({ message: "City name is required" });
        }

        // Case-insensitive Search
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${cleanedCity}$`, "i") },
        }).populate("items"); // ✅ Items bhi dikhane honge user ko

        return res.status(200).json(shops);
    } catch (error) {
        console.error("❌ Get Shop By City Error:", error);
        return res.status(500).json({ message: error.message });
    }
};