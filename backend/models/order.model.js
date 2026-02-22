import mongoose from 'mongoose';

const shopOrderItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String } // Optional: Agar image bhi save karni ho
}, { timestamps: true });

const shopOrderSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },

    // 👇👇 UPDATE HERE 👇👇
    status: {
        type: String,
        // Frontend ke dropdown se match hona chahiye
        enum: ["Pending", "Accepted", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
        default: "Pending"
    },
    // 👆👆 UPDATE END 👆👆

    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryAssignment',
        default: null
    },

    assignedDeliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryOtp: {
        type: String,
        default: null
    },
    
    otpExpires: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default:null
    },
    shopOrderItems: [shopOrderItemSchema]
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'], // ✅ FIX 3: Lowercase kiya (Frontend se match karne ke liye)
        required: true
    },
    deliveryAddress: {
        text: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    // ✅ FIX 4: Name change (total -> totalAmount) to match Controller
    totalAmount: {
        type: Number,
        required: true
    },
    shopOrders: [shopOrderSchema]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;