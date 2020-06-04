var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log(
    "请指定相关端口才能进行下一步哦(✿ヘᴥヘ)\n 列如：node server.js 8888 "
  );
  process.exit(1);
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/
  const session = JSON.parse(fs.readFileSync("./session.json").toString());
  console.log(
    "报告主人！有一位巨巨发来一个请求(✿ ╹◡ ╹) 路径（带查询参数）为：" +
      pathWithQuery
  );

  if (path === "/sign_in" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string); //name password
      const user = userArray.find(
        (user) => user.name === obj.name && user.password === obj.password
      );
      if (user === undefined) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "text/json;charset=utf-8");
        response.end(`{"errorCode": 4001}`);
      } else {
        response.statusCode = 200;
        const random = Math.random();

        session[random] = { user_id: user.id };
        fs.writeFileSync("./session.json", JSON.stringify(session));
        response.setHeader("Set-cookie", `session_id=${random}; HttpOnly`);
      }
      response.end();
    });
  } else if (path === "/home.html") {
    //不会写
    const cookie = request.headers["cookie"];
    let sessionId;
    try {
      sessionId = cookie
        .split(";")
        .filter((s) => s.indexOf("session_id=") >= 0)[0]
        .split("=")[1];
    } catch (error) {}

    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id;
      const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
      const user = userArray.find((user) => user.id === userId);
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      let string = "";
      if (user) {
        string = homeHtml
          .replace("{{loginStatus}}", "已登录")
          .replace(`{{user.name}}`, user.name);
      }
      response.write(string);
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      const string = homeHtml
        .replace("{{loginStatus}}", "未登录")
        .replace(`{{user.name}}`, "");
      response.write(string);
    }
    response.end();
  } else if (path === "/register" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      console.log(obj.name);
      console.log(obj.password);
      const lastUser = userArray[userArray.length - 1];
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password,
      };
      userArray.push(newUser);
      fs.writeFileSync("./db/users.json", JSON.stringify(userArray));
      response.end();
    });
  } else {
    response.statusCode = 200;
    const filePath = path === "/" ? "/index.html" : path;
    //如果用户输入的“/”那么将默认调转到index.html--默认首页
    const index = filePath.lastIndexOf(".");
    const suffix = filePath.substring(index);
    const fileTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/JavaScript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    //识别用户访问的文件后缀
    response.setHeader(
      "Content-Type",
      `${fileTypes[suffix] || "text/html"};charset=utf-8`
    );
    let Content;
    try {
      Content = fs.readFileSync(`./public${filePath}`);
    } catch (error) {
      Content = "对不起主人你的页面被我弄丢了(ಥ﹏ಥ)";
      response.statusCode = 404;
    }
    response.write(Content);
    response.end();
  }

  // {
  //     response.statusCode = 404;
  //     response.setHeader("Content-Type", "text/html;charset=utf-8");
  //     response.write(`对不起主人你的页面被我弄丢了(ಥ﹏ಥ)`);
  //     response.end();
  //   }

  /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
  "报告主人！已经成功监听 " +
    port +
    " 端口啦！{*≧∀≦} \n请主人系好安全带后点击传送门(੭ˊ͈ ꒵ˋ͈)੭̸*✧⁺˚ http://localhost:" +
    port
);
