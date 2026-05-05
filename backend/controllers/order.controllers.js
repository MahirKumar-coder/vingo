import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import Razorpay from "razorpay"
import dotenv from "dotenv"

dotenv.config()

let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
    try {
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

        if (paymentMethod == 'online') {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false

            });

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
                key_id: process.env.RAZORPAY_KEY_ID
            })
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

        await newOrder.populate("shopOrders.owner", "socketId");

        const io = req.app.get('io');

        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner?.socketId; // Ab yahan socketId mil jayega

                if (ownerSocketId) {
                    const myShopOrders = newOrder.shopOrders.filter(o => String(o.owner._id) === String(shopOrder.owner._id));

                    const payload = {
                        ...newOrder.toObject(),
                        shopOrders: myShopOrders
                    };

                    io.to(ownerSocketId).emit('newOrder', payload);
                }
            });
        }

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

        return res.status(201).json({ success: true, message: "Order placed successfully", order: newOrder });

    } catch (error) {
        console.error("❌ BACKEND ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body;
        const payment = await instance.payments.fetch(razorpay_payment_id);

        if (!payment || payment.status != 'captured') {
            return res.status(400).json({ message: 'payment not captured' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(400).json({ message: 'order not found' });
        }

        order.payment = true;
        await order.save();

        // Socket event ke liye data taiyar karna
        await order.populate("shopOrders.shopOrderItems.item", "name image price");
        await order.populate("shopOrders.shop", "name");
        await order.populate("shopOrders.owner", "socketId");

        await order.populate("user", "fullName email mobile");

        const io = req.app.get('io');

        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner?.socketId;

                if (ownerSocketId) {
                    const myShopOrders = order.shopOrders.filter(o => String(o.owner._id) === String(shopOrder.owner._id));

                    const payload = {
                        ...order.toObject(),
                        shopOrders: myShopOrders
                    };

                    io.to(ownerSocketId).emit('newOrder', payload);
                }
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: `verify order error ${error}` });
    }
}

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
                .populate('user', 'fullName email mobile') // User details visible to owner
                .populate('shopOrders.shopOrderItems.item', 'name image price')
                .populate('shopOrders.assignedDeliveryBoy', 'fullName mobile ');

            const filterOrders = orders.map(order => {
                const myShopOrders = order.shopOrders.filter(o => String(o.owner) === String(req.userId));
                return {
                    ...order.toObject(),
                    shopOrders: myShopOrders
                };
            });

            return res.status(200).json(filterOrders);
        }
    } catch (error) {
        return res.status(500).json({ message: `get User Order error ${error}` });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params;
        const { status } = req.body;

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

        let targetShopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId));

        let deliveryBoysPayLoad = [];

        if (status === 'Out for Delivery' && !targetShopOrder.assignment) {
            const { longitude, latitude } = order.deliveryAddress;

            if (!longitude || !latitude) {
                return res.status(400).json({ message: "Order address missing coordinates" });
            }

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(longitude), Number(latitude)]
                        },
                        $maxDistance: 50000
                    }
                }
            });

            const nearByIds = nearByDeliveryBoys.map(b => b._id);

            const busyAssignments = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $nin: ['completed', 'cancelled', 'rejected'] }
            }).distinct("assignedTo");

            const busyIdSet = new Set(busyAssignments.map(id => String(id)));

            const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)));
            const candidates = availableBoys.map(b => b._id);

            if (candidates.length === 0) {
                await order.save();
                return res.status(200).json({
                    success: true,
                    message: "Order status updated, but no delivery boy found nearby.",
                    shopOrder: targetShopOrder
                });
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: targetShopOrder.shop,
                shopOrderId: targetShopOrder._id,
                broadcastedTo: candidates,
                status: "broadcasted"
            });

            targetShopOrder.assignment = deliveryAssignment._id;

            deliveryBoysPayLoad = availableBoys.map(b => ({
                id: b._id,
                fullName: b.fullName,
                mobile: b.mobile,
                latitude: b.location.coordinates[1],
                longitude: b.location.coordinates[0]
            }));

            await order.save();
            await deliveryAssignment.populate('order')
            await deliveryAssignment.populate('shop')

            const io = req.app.get('io');
            if (io) {
                availableBoys.forEach(boy => {
                    if (boy.socketId) {
                        io.to(boy.socketId).emit('newAssignment');
                    }
                });
            }

        }

        const finalOrder = await Order.findById(orderId)
            .populate('shopOrders.shop', 'name')
            .populate('shopOrders.assignedDeliveryBoy', 'fullName email mobile')
            .populate('user', 'socketId _id');

        const finalShopOrder = finalOrder.shopOrders.find(o => String(o.shop._id || o.shop) === String(shopId));

        const io = req.app.get('io');
        if (io && finalOrder.user && finalOrder.user.socketId) {
            io.to(finalOrder.user.socketId).emit('update-status', {
                orderId: finalOrder._id,
                shopId: shopId,
                status: finalShopOrder.status,
                userId: finalOrder.user._id
            });
        }

        return res.status(200).json({
            success: true,
            message: "Status Updated",
            shopOrder: finalShopOrder,
            assignedDeliveryBoy: finalShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayLoad,
            assignment: finalShopOrder?.assignment
        });

    } catch (error) {
        console.error("❌ Status Update Error:", error);
        return res.status(500).json({ message: `Order status error: ${error.message}` });
    }
};

export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId;

        const assignments = await DeliveryAssignment.find({
            broadcastedTo: deliveryBoyId,
            status: 'broadcasted'
        })
            .populate('order')
            .populate('shop');

        // Agar koi assignment na ho to khaali array bhejo
        if (!assignments || assignments.length === 0) {
            return res.status(200).json([]);
        }

        const formatted = assignments.map(a => {
            const targetShopOrder = a.order.shopOrders.find(so => String(so._id) === String(a.shopOrderId));

            return {
                assignmentId: a._id,
                orderId: a.order._id,
                shopName: a.shop ? a.shop.name : "Unknown Shop",
                deliveryAddress: a.order.deliveryAddress,
                items: targetShopOrder ? targetShopOrder.shopOrderItems : [],
                subtotal: targetShopOrder ? targetShopOrder.subtotal : 0
            };
        });

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: `Get Assignment error: ${error.message}` });
    }
};


export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await DeliveryAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(400).json({ message: 'Assignment not found or expired' });
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ['broadcasted', 'completed', 'cancelled', 'rejected'] }
        });

        if (alreadyAssigned) {
            return res.status(400).json({ message: 'You are already assigned to another order' });
        }

        const order = await Order.findById(assignment.order);
        if (!order) {
            return res.status(400).json({ message: 'Order not found' });
        }

        const shopOrderIndex = order.shopOrders.findIndex(so => String(so._id) === String(assignment.shopOrderId));

        if (shopOrderIndex === -1) {
            return res.status(400).json({ message: 'Shop order not found within the main order' });
        }

        order.shopOrders[shopOrderIndex].assignedDeliveryBoy = req.userId;
        order.shopOrders[shopOrderIndex].status = "Out for Delivery";

        await order.save();

        assignment.assignedTo = req.userId;
        assignment.status = 'assigned';
        assignment.acceptedAt = new Date();
        await assignment.save();

        return res.status(200).json({ success: true, message: 'Order accepted successfully' });

    } catch (error) {
        return res.status(500).json({ message: `Accept order error: ${error.message}` });
    }
};


export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: 'assigned' // Ya jo bhi active status ho tumhara
        })
            .populate('shop', 'name')
            .populate('assignedTo', 'fullName email mobile location')
            .populate({
                path: 'order',
                populate: {
                    path: 'user',
                    select: 'fullName mobile' // Yahan hum specifically 'fullName' maang rahe hain
                }
            });

        if (!assignment) {
            return res.status(200).json({ success: true, order: null, message: 'No active assignment' });
        }

        if (!assignment.order) {
            return res.status(400).json({ message: 'order not found' });
        }

        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) === String(assignment.shopOrderId));

        if (!shopOrder) {
            return res.status(400).json({ message: 'shopOrder not found' });
        }

        let deliveryBoyLocation = { lat: null, lon: null };
        if (assignment.assignedTo && assignment.assignedTo.location && assignment.assignedTo.location.coordinates.length === 2) {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
        }

        let customerLocation = { lat: null, lon: null };
        if (assignment.order.deliveryAddress) {
            customerLocation.lat = assignment.order.deliveryAddress.latitude;
            customerLocation.lon = assignment.order.deliveryAddress.longitude;
        }

        return res.status(200).json({
            success: true,
            order: {
                _id: assignment.order._id,
                user: assignment.order.user,
                shopOrder,
                deliveryAddress: assignment.order.deliveryAddress,
                deliveryBoyLocation,
                customerLocation
            }
        });
    } catch (error) {
        return res.status(500).json({ message: `Current order error: ${error.message}` });
    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate('user')
            .populate({
                path: 'shopOrders.shop',
                model: 'Shop'
            })
            .populate({
                path: 'shopOrders.shopOrderItems.item',
                model: 'Item'
            })
            .populate({
                path: 'shopOrders.assignedDeliveryBoy',
                model: 'User',
                select: 'fullName mobile location'
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: 'order not found' })
        }
        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: `get by id order error: ${error.message}` });
    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body;

        const order = await Order.findById(orderId).populate('user');

        if (!order) {
            return res.status(400).json({ message: 'Order not found' });
        }

        const shopOrder = order.shopOrders.id(shopOrderId);

        if (!shopOrder) {
            return res.status(400).json({ message: 'Shop order not found' });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        shopOrder.deliveryOtp = otp;
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;

        await order.save();
        await sendDeliveryOtpMail(order.user, otp);

        return res.status(200).json({ message: `Otp sent Successfully to ${order?.user?.fullName}` });
    } catch (error) {
        return res.status(500).json({ message: `delivery otp error ${error.message}` });
    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body;

        const order = await Order.findById(orderId).populate('user');

        if (!order) {
            return res.status(400).json({ message: 'Order not found' });
        }

        const shopOrder = order.shopOrders.id(shopOrderId);

        if (!shopOrder) {
            return res.status(400).json({ message: 'Shop order not found' });
        }

        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid/Expired Otp' });
        }

        shopOrder.status = "Delivered";
        shopOrder.deliveredAt = Date.now();
        await order.save();

        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        });

        await order.populate("shopOrders.owner", "socketId _id");
        const io = req.app.get('io');
        if (io) {
            const payload = {
                orderId: order._id,
                shopId: shopOrder.shop,
                status: "Delivered",
                userId: order.user._id
            };

            if (order.user && order.user.socketId) {
                io.to(order.user.socketId).emit('update-status', payload);
            }

            if (shopOrder.owner && shopOrder.owner.socketId) {
                io.to(shopOrder.owner.socketId).emit('update-status', payload);
            }
        }

        return res.status(200).json({ message: "Order Delivered" });

    } catch (error) {
        console.error("❌ Verify OTP Error:", error);
        return res.status(500).json({ message: `verify delivery otp error: ${error.message}` });
    }
}

export const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const startsOfDay = new Date()
        startsOfDay.setHours(0, 0, 0, 0)

        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "Delivered",
            "shopOrders.deliveredAt": { $gte: startsOfDay }
        }).lean()

        let todaysDeliveries = []

        orders.forEach(order => {
            order.shopOrders.forEach(shopOrder => {
                if (shopOrder.assignedDeliveryBoy == deliveryBoyId && 
                    shopOrder.status == "Delivered" &&
                    shopOrder.deliveredAt &&
                    shopOrder.deliveredAt >= startsOfDay
                ) {
                    todaysDeliveries.push(shopOrder)
                }
            })
        })

        let stats = {}

        todaysDeliveries.forEach(shopOrder => {
            const hour = new Date(shopOrder.deliveredAt).getHours()
            stats[hour] = (stats[hour] || 0) + 1
        })

        let formattedStats = Object.keys(stats).map(hour => ({
            hour: parseInt(hour),
            count: stats[hour]
        }))

        formattedStats.sort((a, b) => a.hour - b.hour)

        return res.status(200).json(formattedStats)
    } catch (error) {
        return res.status(500).json({ message: `get today deliveries error: ${error.message}` });
    }
}