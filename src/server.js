const express = require('express');
const config = require("../src/configs/index");
const { createServer } = require("http");

server = express();
const httpServer = createServer(server);


require("./loaders/index")(server);

//PORT
const PORT = config.PORT || 8080;

//app listeners
httpServer.listen(PORT, () => {
    console.log("Server running on " + config.PORT);
});

require("./loaders/socket")(httpServer)

