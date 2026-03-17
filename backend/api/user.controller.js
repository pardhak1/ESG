const connection = require("../config/database");
const {
    create,getUsers,updateUser,deleteUser,getUserByUserId
  } = require("./user.service");
  
  const bcrypt = require('bcrypt');
//   const { sign } = require("jsonwebtoken");

  const jwt = require('jsonwebtoken');
  // const cookieParser = require('cookie-parser');
  

  

module.exports={
createUser : (req,res) => {
    const body = req.body;
    console.log("18 = "+JSON.stringify(body))
    create(body,(err,result) => {
        if(err) {
            console.log(err)
            return res.status(500).json({
                success: 0,
                message: "Database connection errror"
            });
        }
        return res.status(200).json({
            success: 1,
            data: result
          });
      
    });
},

getUsers: (req, res) => {
    getUsers((err, results) => {
      if (err) {
        console.log(err);
        return;
      }
      return res.json({
        success: 1,
        data: results
      });
    });
  },

  login: (req, res,next) => {
    //const { username, password } = req.body;
    const username = req.body.email;
    const password = req.body.password;
    console.log(req.body);
    console.log("Received username = " + username)
    const sql = 'SELECT * FROM cfg_user WHERE username = ?';
    const inputArray = [ username];
    connection.query(sql,inputArray, (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      console.log(results);
      if (results.length > 0) {
        const user = results[0];
        console.log(user);
        bcrypt.compare(password, user.password, (err, result, next) => {
            console.log("Bcrypt's password:" + password);
            console.log("Bcrypt's password 2:" + user.password);
            console.log("76 = " + err,result)
          /*
            if (err || !result) {
            return res.status(401).json({ message: 'Authentication failed' });
          }
          */
          const token = jwt.sign( {username: user.username}, process.env.secretKey, { expiresIn: '24h' });
          // Generate refresh token
          //const refreshToken = jwt.sign({ email: user.email }, process.env.secretKey, { expiresIn: '7d' });
          // cookieParser.signedCookie("jwt-token",token)
          // console.log("63-controller = " + cookieParser.signedCookie("jwt-token",token))
          res.status(200).json(token);
        });
      } else { 
        res.status(401).json({ message: 'User not found' });
      } 
    });
  },

  getUserByUserId: (req, res) => {
    const id = req.params.id;
    getUserByUserId(id, (err, results) => {
      if (err) {
        console.log(err);
        return;
      }
      if (!results) {
        return res.json({
          success: 0,
          message: "Record not Found"
        });
      }
      results.password = undefined;
      return res.json({
        success: 1,
        data: results
      });
    });
  },

updateUsers: (req, res) => {
    const body = req.body;
    console.log("89 = " + JSON.stringify(body))

    updateUser(body, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      } else if (results.affectedRows === 0) {
        // No rows affected means no record was found with the given id
        return res.status(404).send({ message: 'User not found' });
      }

      return res.json({
        success: 1,
        message: "updated successfully",
        data:results
      });
    });
  },

  deleteUser: (req, res) => {
    const data = req.body;
    deleteUser(data, (err, results) => {
        
      console.log("112 - result(controller) = " + JSON.stringify(results))
      if (err) {
        console.log(err);
        return res.send({
            message :err
        });
      } 
      
      
      else if (results.affectedRows !== 1) {
        return res.json({
          success: 0,
          message: "Record Not Found",
        //   data:results
        });
      }


      return res.json({
        success: 1,
        message: "user deleted successfully",
        data:results
      });
    });
  }

}