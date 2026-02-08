import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";

// 1. PLACE ORDER (No Changes needed, looks good)
export const placeOrder = async (req, res) => {
    try {
        console.log("🔥 HIT: placeOrder Controller");
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

        if (!cartItems || cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty' });
        if (!deliveryAddress || !deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: 'Incomplete delivery address' });
        }

        const groupItemsByShop = {};
        cartItems.forEach(item => {
            let shopId = item.shop;
            if (shopId && typeof shopId === 'object') shopId = shopId._id;
            const shopIdString = String(shopId);

            if (!groupItemsByShop[shopIdString]) groupItemsByShop[shopIdString] = [];
            groupItemsByShop[shopIdString].push(item);
        });

        const shopOrders = [];
        for (const shopId of Object.keys(groupItemsByShop)) {
            const shop = await Shop.findById(shopId);
            if (!shop) return res.status(404).json({ message: `Shop not found for ID: ${shopId}` });

            const items = groupItemsByShop[shopId];
            const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

            shopOrders.push({
                shop: shop._id,
                owner: shop.owner,
                subtotal,
                status: "Pending",
                shopOrderItems: items.map((i) => ({
                    item: i.id || i._id || i.product,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    image: i.image
                }))
            });
        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        });

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price");
        await newOrder.populate("shopOrders.shop", "name");

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("❌ BACKEND ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
};

// 2. GET MY ORDERS (Fixed Owner Filter Bug)
export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (user.role == 'user') {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate('shopOrders.shop', 'name')
                .populate('shopOrders.owner', 'name email mobile')
                .populate('shopOrders.shopOrderItems.item', 'name image price');

            return res.status(200).json(orders);

        } else if (user.role == 'owner') {
            // Find orders containing this owner
            const orders = await Order.find({ 'shopOrders.owner': req.userId })
                .sort({ createdAt: -1 })
                .populate('shopOrders.shop', 'name')
                .populate('user', 'name email') // User details visible to owner
                .populate('shopOrders.shopOrderItems.item', 'name image price');

            // 👇 FIX: Owner ko sirf uska data bhejo, dusre shops ka nahi
            // Lekin Frontend ko array chahiye, isliye filter karne ke baad wapas array format maintain karo
            const filterOrders = orders.map(order => {
                // Sirf wahi shopOrders rakho jo is owner ke hain
                const myShopOrders = order.shopOrders.filter(o => String(o.owner) === String(req.userId));

                return {
                    ...order.toObject(), // Mongoose obj to JS obj
                    shopOrders: myShopOrders // Replace full list with filtered list
                };
            });

            return res.status(200).json(filterOrders); // ✅ AB SAHI DATA JAYEGA
        }
    } catch (error) {
        return res.status(500).json({ message: `get User Order error ${error}` });
    }
};

// 3. UPDATE ORDER STATUS (Fixed Logic & Variables)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params;
        const { status } = req.body;

        console.log(`🛠 Updating: Order ${orderId}, Shop ${shopId}, Status ${status}`);

        // ✅ 1. Order Find karo aur Status Update karo
        // Variable ka naam 'order' rakho kyunki ye Parent Document hai
        const order = await Order.findOneAndUpdate(
            {
                _id: orderId,
                "shopOrders.shop": shopId
            },
            {
                $set: { "shopOrders.$.status": status }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order or Shop not found" });
        }

        // ✅ 2. Specific Shop Order nikalo (Array me se)
        // Hamein manipulation iske upar karni hai, pure order par nahi
        let targetShopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId));

        let deliveryBoysPayLoad = []; // Scope fix: Bahar declare karo

        if (status === 'Out for Delivery' && !targetShopOrder.assignment) {

            console.log("🚀 Entering Delivery Search Logic...");

            // 1. Address Coordinates Nikalo
            const { longitude, latitude } = order.deliveryAddress;

            if (!longitude || !latitude) {
                return res.status(400).json({ message: "Order address missing coordinates" });
            }

            // 2. Nearby Boys Dhundo (Ab Real Query Use Karo)
            // Kyunki tumhare coordinates match ho rahe hain, ye pakka chalega
            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(longitude), Number(latitude)]
                        },
                        $maxDistance: 50000 // 50km Range (Safety ke liye)
                    }
                }
            });

            console.log(`🎯 Found ${nearByDeliveryBoys.length} Boys nearby.`);

            // 👇 YE LINE MISSING THI ISLIYE ERROR AA RAHA THA
            const nearByIds = nearByDeliveryBoys.map(b => b._id);

            // 3. Busy Boys ko Filter karo
            const busyAssignments = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $nin: ['completed', 'cancelled', 'rejected'] }
            }).distinct("assignedTo");

            const busyIdSet = new Set(busyAssignments.map(id => String(id)));

            // 4. Available Boys Nikalo
            const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)));
            const candidates = availableBoys.map(b => b._id);

            if (candidates.length === 0) {
                // Agar koi free nahi hai, tab bhi status update hone do, bas message bhej do
                await order.save();
                return res.status(200).json({
                    success: true,
                    message: "Order status updated, but no delivery boy found nearby.",
                    shopOrder: targetShopOrder // Frontend update ke liye zaroori
                });
            }

            // 5. Assignment Create Karo
            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: targetShopOrder.shop,
                shopOrderId: targetShopOrder._id,
                broadcastedTo: candidates,
                status: "broadcasted" // Ya 'assigned' agar direct dena hai
            });

            // 6. Link Assignment to Order
            targetShopOrder.assignment = deliveryAssignment._id;

            // First available boy ko direct assign kar rahe ho toh:
            // (Filhal tum broadcast kar rahe ho, lekin UI me dikhane ke liye payload bhejo)

            deliveryBoysPayLoad = availableBoys.map(b => ({
                id: b._id,
                fullName: b.fullName,
                mobile: b.mobile,
                latitude: b.location.coordinates[1],
                longitude: b.location.coordinates[0]
            }));

            // Save changes
            await order.save();
        }
        const finalOrder = await Order.findById(orderId)
            .populate('shopOrders.shop', 'name')
            .populate('shopOrders.assignedDeliveryBoy', 'fullName email mobile');

        const finalShopOrder = finalOrder.shopOrders.find(o => String(o.shop) === String(shopId));

        return res.status(200).json({
            success: true,
            message: "Status Updated",
            shopOrder: finalShopOrder,
            assignedDeliveryBoy: finalShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayLoad,
            assignment: finalShopOrder?.assignment // Ab ye defined milega
        });

    } catch (error) {
        console.error("❌ Status Update Error:", error);
        return res.status(500).json({ message: `Order status error: ${error.message}` });
    }
};