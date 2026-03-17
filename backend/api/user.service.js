const connection = require("../config/database");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express')
const app =express()
app.use(bodyParser.json())

module.exports ={
create:(data,callback) =>{
        const email = data.email;
        const password=data.password;
        const firstname=data.firstname;
        const lastname=data.lastname;
        const username=data.username;
    bcrypt.hash(password,10,(err,hash) =>{
        if(err) {
            callback(err)
        } else {
            const user = { email, 
              password: hash,
              firstname,
              lastname,
              username

            };
            console.log(user);
         
            connection.query('INSERT INTO cfg_user SET ?', [user], (err,results,fields) => {
                if(err) {

                    callback(err)
                } else {
                    return callback(null,results)
                }
            })
        }
    })
   
}
,

getUsers: callBack => {
    connection.query(
      `select * from cfg_user`,
      [],
      (error, results, fields) => {
        if (error) {
          callBack(error);
        }
        return callBack(null, results);
      }
    );

  },

  getUserByUserId: (id, callBack) => {
    connection.query(
      `select id,email,password from cfg_user where id = ?`,
      [id],
      (error, results, fields) => {
        if (error) {
          callBack(error);
        }
        return callBack(null, results[0]);
      }
    );
  },
  

  // Update user route
updateUser:(data, callBack) => {
    const salt = 10;
    bcrypt.hash(data.password, salt,(err,hashedPassword) => {
        console.log("66 66=  "+hashedPassword)
        const userId = data.id
        const email = data.email; // Destructuring assignment
  
        // Using template literals for readability, be cautious of SQL injection
        const query = `UPDATE cfg_user SET  email = ? , password = ? WHERE id = ?`;
      
        // Executing the query with placeholders for safety against SQL injection
        connection.query(query, [email,hashedPassword,userId], 
          
            (error, results) => {
          if (error) {
            console.error("Error occurred: ", error);
            callBack(error)
    
          } 
          return callBack(null,results)
    
        }
        
        );
    });

  
  }
  
,
  deleteUser: (data, callBack) => {
    console.log(JSON.stringify(data))
    connection.query(
      `delete from cfg_user where id = ?`,
      [data.id],
      (error, results, fields) => {
        if (error) {
          callBack(error);
        }
        console.log("101 = " + results)
        return callBack(null, results);
      }
    );
  }

    




}
