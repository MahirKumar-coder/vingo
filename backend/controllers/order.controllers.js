import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js"

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
                        item: i.id,  // ✅ Ab ye undefined nahi hoga
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

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name")

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

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (user.role == 'user') {


            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate('shopOrders.shop', 'name')
                .populate('shopOrders.owner', 'name email mobile')
                .populate('shopOrders.shopOrderItems.item', 'name image price')

            return res.status(200).json(orders)
        } else if (user.role == 'owner') {
            const orders = await Order.find({ 'shopOrders.owner': req.userId })
                .sort({ createdAt: -1 })
                .populate('shopOrders.shop', 'name')
                .populate('user')
                .populate('shopOrders.shopOrderItems.item', 'name image price')

            const filterOrders = orders.map((order => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress
            })))

            return res.status(200).json(orders)
        }
    } catch (error) {
        return res.status(500).json({ message: `get User Order error ${error}` })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status } = req.body
        const order = await Order.findById(orderId)

        const shopOrder = order.shopOrders.find(o => o.shop == shopId)
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found"})
        }
        shopOrder.status = status
        await shopOrder.save()
        await order.save()
        
        return res.status(200).json(shopOrder.status)
    } catch (error) {
        return res.status(500).json({ message: `order status error ${error}`})
    }
}