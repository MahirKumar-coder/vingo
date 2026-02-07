import User from "../models/user.model.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(400).json({ message: "User not authenticated" })
        }
        const user = await User.findById(userId)
        if(!user) {
            return res.status(400).json({ message: "User not found" })
        }
        return res.status(200).json({ user })
    } catch (error) {
        return res.status(500).json({ message: `Server error ${error}` })
    }
}

export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        
        // 1. Database Update (Ye sahi hai)
        const user = await User.findByIdAndUpdate(req.userId, {
            location: {
                type: 'Point',
                coordinates: [lon, lat] // Note: MongoDB me [Longitude, Latitude] hota hai
            }
        }, { new: true });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // 👇 2. YAHAN CHANGE KARO: Response me Data bhejo
        // Filhal hum hardcode kar rahe hain taaki error hat jaye.
        // Baad me yahan Real Geocoding API lagegi.
        
        return res.status(200).json({ 
            message: 'location updated',
            city: "Patna",       // <--- Ye Frontend dhoond raha hai
            state: "Bihar",
            address: "Frazer Road, Patna, Bihar" 
        });

    } catch (error) {
        return res.status(500).json({ message: `Update location user ${error}` });
    }
}