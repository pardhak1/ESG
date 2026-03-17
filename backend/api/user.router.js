const router = require("express").Router();
const {createUser,getUsers,updateUsers,deleteUser,login,getUserByUserId} = require("./user.controller");
  const { checkToken } = require("../auth/token_validation");

 router.post("/",
 checkToken,
 createUser);
 router.get("/",
 checkToken,
 getUsers);
 router.post("/login", login);
 router.get("/:id", checkToken, getUserByUserId);
 router.patch("/", checkToken, updateUsers); 
 router.delete("/", checkToken, deleteUser);

 module.exports=router;