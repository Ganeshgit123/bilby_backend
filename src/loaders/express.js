module.exports = (app) => {
    const config = require("../configs/index");
    const morgan = require('morgan');
    const cors = require("cors");
    const errorHandler = require("../api/middlewares/error-handler");
    const apiRouter = require("../api/routes/index");
    const bodyParser = require('body-parser');

    require("./logger")(app);
  
    app.use(cors());
    
    //use strict
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    
    //API Routes
    app.use(`/${config.API_PREFIX}`, apiRouter);
    app.use(errorHandler);

  };
  