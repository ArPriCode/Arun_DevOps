// const jwt = require('jsonwebtoken');

// const verifyToken = (req, res, next) => {
//     const token = req.headers.authorization; // "Bearer <token>"

//     if (!token) {
//         return res.status(401).json({ message: "No token provided" });
//     }

//     const [prefix, accessToken] = token.split(" ");
//     if (prefix !== "Bearer" || !accessToken) {
//         return res.status(401).json({ message: "Invalid token format" });
//     }

//     jwt.verify(accessToken, process.env.SECRET_KEY, (err, decoded) => {
//         if (!err) {
//             // Access token valid
//             req.user = decoded;
//             return next();
//         }

//         // Access token expired
//         if (err.name === "TokenExpiredError") {
//             const refreshToken = req.headers.refreshtoken; // <-- must be lowercase for Node

//             if (!refreshToken) {
//                 return res.status(401).json({ message: "Token expired. No refresh token provided." });
//             }

//             jwt.verify(refreshToken, process.env.REFRESH_KEY, (refreshErr, refreshDecoded) => {
//                 if (refreshErr) {
//                     return res.status(401).json({ message: "Invalid refresh token. Please log in again." });
//                 }

//                 // Generate new token pair
//                 const newTokens = generateTokenPair(refreshDecoded);

//                 // Attach new access token to response header
//                 res.setHeader("x-access-token", newTokens.accessToken);
//                 res.setHeader("x-refresh-token", newTokens.refreshToken);

//                 req.user = refreshDecoded; // attach decoded user data
//                 return next();
//             });

//         } else {
//             return res.status(401).json({ message: "Unauthorized" });
//         }
//     });
// };

// const generateTokenPair = (decode) => {
//     const accessToken = jwt.sign(
//         { id: decode.id, email: decode.email },
//         process.env.SECRET_KEY,
//         { expiresIn: '7d' }
//     );

//     const refreshToken = jwt.sign(
//         { id: decode.id, email: decode.email },
//         process.env.REFRESH_KEY,
//         { expiresIn: '30d' }
//     );

//     return { accessToken, refreshToken };
// };

// module.exports = { verifyToken, generateTokenPair };





