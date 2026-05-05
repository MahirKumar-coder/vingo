// routes/auth.routes.js
import express from "express";
import isAuth from "../middleware/isAuth.js";
import { addItem, deleteItem, editItem, getItemByCity, getItemById, getItemsByShop, rating, searchItems } from "../controllers/item.controllers.js";
import { upload } from "../middleware/multer.js";

const itemRouter = express.Router();
// Protected endpoints (require authentication)
itemRouter.post("/add-item", isAuth, upload.single("image"), addItem)
itemRouter.put("/edit-item/:itemId", isAuth, upload.single("image"), editItem)
itemRouter.delete("/delete/:itemId", isAuth, deleteItem)
itemRouter.post("/rating", isAuth, rating)

// Public endpoints (no auth required for viewing items)
itemRouter.get("/get-by-id/:itemId", getItemById)
itemRouter.get("/get-by-city/:city", getItemByCity)
itemRouter.get("/get-by-shop/:shopId", getItemsByShop)
itemRouter.get("/search-items", searchItems)

export default itemRouter;
// 10:57:10