// // const jwt = require("jsonwebtoken");
// module.exports ={
//     checkToken : (req, res, next) => {
//         const bearerHeader = req.headers['authorization'];
//         console.log(bearerHeader)
//         if (typeof bearerHeader !== 'undefined') {
//           const bearerToken = bearerHeader.split(' ')[1];
//           req.token = bearerToken;
//           next();
//         } else {
//           res.sendStatus(403);
//         }
//       }
      
// }
const jwt = require("jsonwebtoken");
module.exports = {
  checkToken: (req, res, next) => {
    let token = req.get("authorization");
    if (token) {
      // Remove Bearer from string
      token = token.slice(7);
      console.log("23 = " + token)
      jwt.verify(token, process.env.secretKey, (err, decoded) => {
        if (err) {
          return res.json({
            success: 0,
            message: "Invalid Token..."
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.json({
        success: 0,
        message: "Access Denied! Unauthorized User"
      });
    }
  }
};
