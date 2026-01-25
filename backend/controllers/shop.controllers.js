import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

// ✅ helper function
const cleanValue = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === "undefined" ||
        value === "null"
    ) {
        return "";
    }
    return value.trim();
};

export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;

        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path);
        }

        const payload = {
            name: name?.trim(),
            city: city?.trim(),
            state: state?.trim(),
            address: address?.trim(),
            owner: req.userId,
        };

        if (image) payload.image = image;

        let shop = await Shop.findOne({ owner: req.userId });

        if (!shop) {
            shop = await Shop.create(payload);
        } else {
            shop = await Shop.findByIdAndUpdate(
                shop._id,
                payload,
                { new: true }
            );
        }

        // ✅ CORRECT populate
        await shop.populate([
            { path: "owner" },
            {
                path: "items",
                options: { sort: { updatedAt: -1 } }
            }
        ]);

        return res.status(200).json(shop);

    } catch (error) {
        console.error("❌ create shop error:", error);
        return res.status(500).json({
            message: "create shop error",
            error: error.message
        });
    }
};


export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId }).populate("owner items");
        return res.status(200).json(shop);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getShopByCity = async (req, res) => {
    try {
        const { city } = req.params;

        const cleanedCity = city.trim();

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${cleanedCity}$`, "i") },
        });

        return res.status(200).json(shops);
    } catch (error) {
        console.error("getShopByCity error:", error);
        return res.status(500).json({ message: error.message });
    }
};
