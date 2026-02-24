import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/item.model.js"
import Shop from "../models/shop.model.js";

export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }
        const shop = await Shop.findOne({ owner: req.userId }).populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        if (!shop) {
            return res.status(400).json({ message: "shop not found" })
        }
        const item = await Item.create({
            name, category, foodType, price, image, shop: shop._id
        })

        shop.items.push(item._id)
        await shop.save()
        await shop.populate("owner")
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        return res.status(201).json(shop)
    } catch (error) {
        return res.status(500).json({ message: `add item error ${error}` })
    }
}

export const editItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, category, foodType, price } = req.body;

        const updateData = { name, category, foodType, price };

        if (req.file) {
            const image = await uploadOnCloudinary(req.file.path);
            updateData.image = image;
        }

        const item = await Item.findByIdAndUpdate(
            itemId,
            updateData,
            { new: true }
        );

        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        // 🔥 MAIN FIX — SHOP KO DUBARA FETCH KARO (SORT KE SAATH)
        const shop = await Shop.findById(item.shop)
            .populate("owner")
            .populate({
                path: "items",
                options: { sort: { updatedAt: -1 } }
            });

        return res.status(200).json(shop);
    } catch (error) {
        console.log("edit item error", error);
        return res.status(500).json({ message: error.message });
    }
};



export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" })
        }
        return res.status(200).json(item)
    } catch (error) {
        return res.status(500).json({ message: `get item error ${error}` })
    }
}

export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)
        if (!itemId) {
            return res.status(400).json({ message: "item not found" })
        }
        const shop = await Shop.findOne({ owner: req.userId })
        shop.items = shop.items.filter(i => i !== item._id)
        await shop.save()
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        });
        return res.status(200).json(shop);
    } catch (error) {
        return res.status(500).json({ message: `deleted item error ${error}` })
    }
}

export const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({ message: "city is required" });
        }

        // ✅ CLEAN CITY PROPERLY
        const cleanedCity = city.trim();

        // 1️⃣ Find shops in city
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${cleanedCity}$`, "i") },
        });

        if (!shops || shops.length === 0) {
            return res.status(200).json([]); // 👈 empty array is OK
        }

        // 2️⃣ Extract shop IDs
        const shopIds = shops.map((shop) => shop._id);

        // 3️⃣ Find items of those shops
        const items = await Item.find({
            shop: { $in: shopIds },
        }).populate("shop");

        return res.status(200).json(items);
    } catch (error) {
        console.log("get item by city error:", error);
        return res.status(500).json({
            message: "get item by city error",
            error: error.message,
        });
    }
};

export const getItemsByShop = async (req, res) => {
    try {
        const {shopId} = req.params
        const shop = await Shop.findById(shopId).populate("items")
        if (!shop) {
            return res.status(400).json("shop not found")
        }
        return res.status(200).json({
            shop, items: shop.items
        })
    } catch (error) {
        return res.status(500).json({ message: `get item by shop error ${error}` })
    }
}