const jwt = require("jsonwebtoken");
const config = require("../../configs/index");
const { USERHISTORY, USER } = require("../models/user/auth");
const translate = require("../../constants");
const { CFAM } = require("../dao");


module.exports = async function(req, res, next) {
  const token = req.header("auth");
  if (!token) {
    return res.status(401).json({
      message: "No token, authorization failed",
    });
  } else {
    try {
      await jwt.verify(token, config.secret, 
        (err, decoded) => {
        if (!err) {
            USERHISTORY
            .findOne({token})
            .sort({createdAt: -1})
            .exec(
              async (err, _admin_) => {
                if (err) {
                    res.status(401).json({
                    message: "Wrong token",
                    });
                } else if (_admin_?.isLogout) {
                    res.status(401).json({
                    message: "Your token has been expired",
                    });
                } else {
                    let { lang} = req.body
                    let { userId } = _admin_
                    
                    let queryOp= {
                      query : {
                        _id: userId
                      }
                    }
                    
                    let result = await CFAM( USER, 'findOne', queryOp, lang)
                    if(!result.error){
                      req.auth = {
                        ...result?.data?._doc,
                        userId: result?.data?._id
                      };
                      next();
                    }else{
                      res.status(401).json({
                          error: true,
                          message: translate[lang || 'en'].NOTAUTH,
                      });
                    }

                }
              }
            )
        } else {
          res.status(401).json({
            message: err.message,
          });
        }
      });
    } catch (error) {
      res.status(401).json({
        message: error.message,
      });
    }
  }
};
