const jwt = require("jsonwebtoken");
const config = require("../../configs/index");
const { CFAM } = require("../dao");
const { ADMINHISTORY } = require("../models/admin/auth");


module.exports = async function(req, res, next) {
  const token = req.header("auth");
  if (!token) {
    return res.status(401).json({
      msg: "No token, authorization failed",
    });
  } else {
    try {
      await jwt.verify(token, config.secret, 
        (err, decoded) => {
        if (!err) {
            ADMINHISTORY
            .findOne({token})
            .sort({ createdAt: -1 })
            .exec(
              async (err, _admin_) => {
                if (err) {
                    res.status(401).json({
                    msg: "Wrong token",
                    });
                } else if (_admin_?.isLogout) {
                    res.status(401).json({
                    msg: "Your token has been expired",
                    });
                } else if(_admin_){
                    let { lang } = req.body
                    let { adminId } = _admin_
                    
                    let queryOp= {
                      query : {
                        _id: adminId
                      }
                    }
                    
                    let result = await CFAM( ADMINACCOUNT, 'findOne', queryOp, lang) || await CFAM( ADMINUSER, 'findOne', queryOp, lang)

                    if(!result.error){
                      req.auth = {
                        ...result?.data?._doc,
                        adminId: result?.data?._id
                      };
                      next();
                    }else{
                      res.status(401).json({
                          error: true,
                          message: translate[lang || 'en'].NOTAUTH,
                      });
                    }

                }else{
                  res.status(401).json({
                    msg: "Your token not valid",
                    });
                }
              }
            )
        } else {
          res.status(401).json({
            msg: err.message,
          });
        }
      });
    } catch (error) {
      res.status(401).json({
        msg: error.message,
      });
    }
  }
};
