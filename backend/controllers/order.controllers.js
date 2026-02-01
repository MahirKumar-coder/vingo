import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";

export const placeOrder = async (req, res) => {
    try {
        console.log("🔥 HIT: placeOrder Controller");

        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

        // 1. Validations
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        if (!deliveryAddress || !deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: 'Incomplete delivery address' });
        }

        // 2. Group items by Shop ID
        const groupItemsByShop = {};

        cartItems.forEach(item => {
            // 🚨 FIX: Agar shop object hai to ID nikalo, warna direct use karo
            let shopId = item.shop;

            if (shopId && typeof shopId === 'object') {
                shopId = shopId._id; // Object me se ID nikal li
            }

            // Ab ye pakka String ban gya
            const shopIdString = String(shopId);

            if (!groupItemsByShop[shopIdString]) {
                groupItemsByShop[shopIdString] = [];
            }
            groupItemsByShop[shopIdString].push(item);
        });

        // 3. Process Logic
        const shopOrders = [];

        for (const shopId of Object.keys(groupItemsByShop)) {
            // Yahan ab shopId ek Sahi ID string hogi, "[object Object]" nahi
            const shop = await Shop.findById(shopId);

            if (!shop) {
                return res.status(404).json({ message: `Shop not found for ID: ${shopId}` });
            }

            const items = groupItemsByShop[shopId];

            // Subtotal Calculation
            const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

            shopOrders.push({
                shop: shop._id,
                owner: shop.owner,
                subtotal,
                status: "Pending",
                shopOrderItems: items.map((i) => {
                    // 👇 FIX: Check karo ID kahan chhipi hai (_id, id, ya product)
                    const productId = i._id || i.id || i.product;

                    if (!productId) {
                        console.error("❌ ERROR: Product ID missing in item:", i);
                    }

                    return {
                        item: productId,  // ✅ Ab ye undefined nahi hoga
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        image: i.image
                    };
                })
            });
        }

        // 4. Create Order
        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        });

        console.log("✅ Order Created Successfully:", newOrder._id);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder
        });

    } catch (error) {
        console.error("❌ BACKEND ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
};