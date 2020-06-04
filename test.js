const fs = require("fs");

//开始读取数据
const usersString = fs.readFileSync("./db/users.json").toString();
const usersArray = JSON.parse(usersString);

//开始写入数据
const user3 = { id: 3, name: "toni", password: "xxx" };
usersArray.push(user3);
const string = JSON.stringify(usersArray);
fs.writeFileSync("./db/user.json", string);
