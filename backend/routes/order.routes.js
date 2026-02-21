import express from "express";
import isAuth from "../middleware/isAuth.js";
import { acceptOrder, getCurrentOrder, getDeliveryBoyAssignment, getMyOrders, getOrderById, placeOrder, updateOrderStatus } from "../controllers/order.controllers.js";

const orderRouter = express.Router();
orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.get("/my-orders", isAuth, getMyOrders);
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment);
orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);

// ✅ FIX 1: isko .get() se badal kar .post() kar diya
orderRouter.post("/accept-order/:assignmentId", isAuth, acceptOrder);

// ✅ FIX 2: isme se "/:assignmentId" hata diya taaki frontend wale URL se match kare
orderRouter.get("/get-current-order", isAuth, getCurrentOrder); 
orderRouter.get("/get-order-by-id/:orderId", isAuth, getOrderById); 

export default orderRouter;