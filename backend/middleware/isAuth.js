import jwt from 'jsonwebtoken'

const isAuth = (req, res, next) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(400).json({ message:"token not found" })
        }
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!decodeToken) {
            return res.status(400).json({ message:"invalid token" })
        }
        
        req.userId = decodeToken.userId
        next()
        
    } catch (error) {
        return res.status(500).json({ message:"isAuth error" })
    }
}

export default isAuth