import User from "./models/user.model.js";

export const socketHandler = async (io) => {
    io.on('connection', (socket) => {
        
        socket.on('identity', async ({ userId }) => {
            try {
                const user = await User.findByIdAndUpdate(userId, {
                    socketId: socket.id, isOnline: true
                }, { new: true });
            } catch (error) {
                console.log(error);
            }
        });

        socket.on('updateLocation', async ({ latitude, longitude, userId }) => {
            try {
                // 👇 FIX 1: 'const user =' lagana zaroori hai! Aur { new: true } bhi laga diya
                const user = await User.findByIdAndUpdate(userId, {
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude] // MongoDB GeoJSON hamesha [lon, lat] leta hai
                    },
                    isOnline: true,
                    socketId: socket.id
                }, { new: true });

                // 👇 FIX 2: Ab 'user' define ho chuka hai, toh ye if block chalega!
                if (user) {
                    // Debugging ke liye log daal diya hai
                    console.log(`📍 Broadcasting Location to Customer! Boy ID: ${userId}`); 
                    
                    io.emit('updateDeliveryLocation', {
                        deliveryBoyId: userId,
                        latitude,
                        longitude
                    });
                }
            } catch (error) {
                // FIX 3: Error detail print karne ke liye error object pass kiya
                console.log('❌ updateDeliveryLocation error:', error.message);
            }
        });

        socket.on('disconnect', async () => {
            try {
                await User.findOneAndUpdate({ socketId: socket.id }, {
                    socketId: null,
                    isOnline: false
                });
            } catch (error) {
                console.log(error);
            }
        });
        
    });
}