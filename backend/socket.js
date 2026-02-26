export const socketHandler = async (io) => {
    io.on('connection', (socket)=>{
        console.log(socket.id);
        
    })
}

// 3:11:33