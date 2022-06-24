const { ADMINACCOUNT } = require("../models/admin/auth");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotalySecretKey");
const { logToConsole } = require("../logger/index.js");
const translate = require("../../constants");

const CFAM = async ( model, action, data, lang, populate, select, sort, validation ) => {
  try {
    if (action == "create" || action == "insertMany") {
      return new Promise(async (resolve, reject) => {
        model[action](data, async (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: `${action}` error: " + err_);
            resolve({
              error: true,
              message: translate["en"].PLEASETRYLATER,
              errMessage: err_.message,
            });
          } else if (data_?.length != 0 || data_) {
            if (data_ != null) {
              resolve({
                error: false,
                message:
                  action == "findOneAndRemove"
                    ? translate["en"].DATADELETED
                    : action == "find"
                    ? translate["en"].DATAFOUND
                    : translate["en"].DATACREATED,
                data: data_,
              });
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          } else {
            resolve({
              error: true,
              message: translate["en"].DATANOTFOUND,
            });
          }
        });
      });
    } else if (action == "find") {
      return new Promise(async (resolve, reject) => {
        model[action](data)
          .populate(populate || undefined)
          .select(select || undefined)
          .sort(sort || undefined)
          .exec(async (err_, data_) => {
            if (err_) {
              logToConsole.info("ACTION: `${action}` error: " + err_);
              resolve({
                error: true,
                message: translate["en"].PLEASETRYLATER,
                errMessage: err_.message,
              });
            } else if (data_?.length != 0) {
              if (data_ != null) {
                resolve({
                  error: false,
                  message:
                    action == "findOneAndRemove"
                      ? translate["en"].DATADELETED
                      : action == "find"
                      ? translate["en"].DATAFOUND
                      : translate["en"].DATACREATED,
                  data: data_,
                });
              } else {
                resolve({
                  error: true,
                  message: translate["en"].DATANOTFOUND,
                });
              }
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          });
      });
    } else if(action == "findOneAndRemove"){
      return new Promise(async (resolve, reject) => {
        model[action](data)
          .populate(populate || undefined)
          .select(select || undefined)
          .sort(sort || undefined)
          .exec(async (err_, data_) => {
            if (err_) {
              logToConsole.info("ACTION: `${action}` error: " + err_);
              resolve({
                error: true,
                message: translate["en"].PLEASETRYLATER,
                errMessage: err_.message,
              });
            } else if (data_?.length != 0 || data_) {
              if (data_ != null) {
                resolve({
                  error: false,
                  message:
                    action == "findOneAndRemove"
                      ? translate["en"].DATADELETED
                      : action == "find"
                      ? translate["en"].DATAFOUND
                      : translate["en"].DATACREATED,
                  data: data_,
                });
              } else {
                resolve({
                  error: true,
                  message: translate["en"].DATANOTFOUND,
                });
              }
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          });
      });
    } else {
      return new Promise(async (resolve, reject) => {
        model[action](data.query, data.update, data.new)
          .select(data.select || undefined)
          .populate(data.populate || undefined)
          .sort(data.sort || undefined)
          .exec(async (err_, data_) => {
            if (err_) {
              logToConsole.info("ACTION: `${action}` error: " + err_);
              resolve({
                error: true,
                message: translate["en"].PLEASETRYLATER,
                errMessage: err_.message,
              });
            } else if (data_) {
              resolve({
                error: false,
                message:
                  action == "findOne"
                    ? translate["en"].DATAFOUND
                    : translate["en"].DATAUPDATED,
                data: data_,
              });
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          });
      });
    }
  } catch (err) {
    logToConsole.error("ACTION: CFAM error:" + err);
    return {
      error: true,
      message: translate["en"].SERVERERR,
      errMessage: err.message,
    };
  }
};

const CFAMAggrigate = async ( model, action, data, lang ) => {
  try {
    return new Promise(async (resolve, reject) => {
      model[action](data)
        .exec(async (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: `${action}` error: " + err_);
            resolve({
              error: true,
              message: translate["en"].PLEASETRYLATER,
              errMessage: err_.message,
            });
          } else if (data_.length) {
            resolve({
              error: false,
              message: translate["en"].DATAFOUND,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate["en"].DATANOTFOUND,
            });
          }
        });
    });
  } catch (err) {
    logToConsole.error("ACTION: CFAM error:" + err);
    return {
      error: true,
      message: translate["en"].SERVERERR,
      errMessage: err.message,
    };
  }
};

const CFAMFindPagination = async ( model, data, lang, skip, limit ) => {
  try {
    return new Promise(async (resolve, reject) => {
      model['find'](data)
        .skip(skip) // Always apply 'skip' before 'limit'
        .limit(limit) 
        .exec(async (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: `${action}` error: " + err_);
            resolve({
              error: true,
              message: translate["en"].PLEASETRYLATER,
              errMessage: err_.message,
            });
          } else if (data_.length) {
            resolve({
              error: false,
              message: translate["en"].DATAFOUND,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate["en"].DATANOTFOUND,
            });
          }
        });
    });
  } catch (err) {
    logToConsole.error("ACTION: CFAM error:" + err);
    return {
      error: true,
      message: translate["en"].SERVERERR,
      errMessage: err.message,
    };
  }
};

const CFAMFIND = async ( model, action, data, lang, populate, select, sort ) => {
  try {
    return new Promise(async (resolve, reject) => {
      model[action](...data)
        .populate(populate || undefined)
        .select(select || undefined)
        .sort(sort || undefined)
        .exec(async (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: `${action}` error: " + err_);
            resolve({
              error: true,
              message: translate["en"].PLEASETRYLATER,
              errMessage: err_.message,
            });
          } else if (data_?.length != 0) {
            if (data_ != null) {
              resolve({
                error: false,
                message:
                  action == "findOneAndRemove"
                    ? translate["en"].DATADELETED
                    : action == "find"
                    ? translate["en"].DATAFOUND
                    : translate["en"].DATACREATED,
                data: data_,
              });
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          } else {
            resolve({
              error: true,
              message: translate["en"].DATANOTFOUND,
            });
          }
        });
    });
  } catch (err) {
    logToConsole.error("ACTION: CFAM error:" + err);
    return {
      error: true,
      message: translate["en"].SERVERERR,
      errMessage: err.message,
    };
  }
};

const CFAMValidation = async ( model, action, data, lang, validation, validationKey) => {
  try {

    let valid = {
      error: true,
      message: "Check validation"
    };

    if(validation && typeof validationKey == 'object'){
      await validationKey.map( async item => {
        valid = new Promise(async (resolve, reject) => {
          model['findOne']({
            [item]:data[item]
          }, async (err_, data_) => {
            if (err_) {
              resolve(
                {
                  error: true,
                  message: translate["en"].ERRORONVALIDATION
                }
              );
            } else if (data_) {
              resolve(
                {
                  error: true,
                  message: translate["en"].VALIDATIONERROR +  "[ "+item+" ]"
                }
              )
            } else {
              resolve(
                {
                  error: false,
                  message: translate["en"].VALIDATIONSUCCESS
                }
              );
            }
          });
        });
      })
    }else{
      valid = {
        error: false,
        message: "Validation success"
      };
    }

    let ifSuccess = await valid;
    
    if(ifSuccess.error == false){
      return new Promise(async (resolve, reject) => {
        model[action](data, async (err_, data_) => {
          if (err_) {
            resolve({
              error: true,
              message: translate["en"].PLEASETRYLATER,
              errMessage: err_.message,
            });
          } else if (data_?.length != 0 || data_) {
            if (data_ != null) {
              resolve({
                error: false,
                message:translate["en"].DATACREATED,
                data: data_,
              });
            } else {
              resolve({
                error: true,
                message: translate["en"].DATANOTFOUND,
              });
            }
          } else {
            resolve({
              error: true,
              message: translate["en"].DATANOTFOUND,
            });
          }
        });
      });
    }else{
      return valid
    }
    
  } catch (err) {
    logToConsole.error("ACTION: CFAM error:" + err);
    return {
      error: true,
      message: translate["en"].SERVERERR,
      errMessage: err.message,
    };
  }
};


const createAdminAccountDao = async (data) => {
  let {adminName, role, lang} = data;
  try{
    return new Promise(async(resolve, reject) => {
      let isExist = await findAdminDao({adminName, role}, true, lang);
      if(isExist.error){
        ADMINACCOUNT.create(
          data, 
          (err_, data_) => {
            if (err_) {
              logToConsole.info("ACTION: createAdminAccountDao error:"+err_)    
              resolve({
                error: true,
                message: translate['en' ].PLEASETRYLATER,
                errMessage: err_.message,
              })
            } else if (data_) {
              resolve({
                error: false,
                message: translate['en' ].DATACREATED,
                data: data_,
              });
            } else {
              resolve({
                error: true,
                message: translate['en' ].DATANOTCREATED,
              });
            }
          }
        );
      }else if(isExist.data){
        resolve({
          error: true,
          message:  translate['en' ].ADMINEXIST,
        })
      }else{
        resolve(isExist)
      }
    });
  }catch (err) {
        logToConsole.error("ACTION: createAdminAccountDao error:"+err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
  }
}

const findAdminDao = async (query, strict, lang, select) => {
  try{
    return new Promise((resolve, reject) => {
      ADMINACCOUNT.findOne(
        query
      )
      .select(select)
      .exec(
        (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: findAdminDao error:"+ err_)
            resolve({
              error: true,
              message: translate['en' ].PLEASETRYLATER,
              errMessage: err_.message,
            })
          } else if (data_) {
            resolve({
              error: false,
              message: translate['en' ].DATAFOUND,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate['en' ].DATANOTFOUND,
            });
          }
        }
      )
    });
  }catch (err) {
        logToConsole.error("ACTION: findAdminDao error:"+ err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
    }
}

const saveAdminHistoryDao = async (data, lang) => {
  try{
    return new Promise((resolve, reject) => {
      delete data._id;
      ADMINHISTORY.create(
        data, 
        (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: saveAdminHistoryDao error:"+err_)
            resolve({
              error: true,
              message: translate['en' ].PLEASETRYLATER,
              errMessage: err_.message,
            })
          } else if (data_) {
            resolve({
              error: false,
              message: translate['en' ].DATACREATED,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate['en' ].DATANOTCREATED,
            });
          }
        }
      );
    });
  }catch (err) {
        logToConsole.error("ACTION: saveAdminHistoryDao error:"+err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
    }
}

const findOneUpdateAdminHistoryDao = async (query, data, lang) => {
  try{
    return new Promise((resolve, reject) => {
      ADMINHISTORY.findOneAndUpdate(
        query,
        data, 
        {new: true},
        (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: saveAdminHistoryDao error:"+err_)
            resolve({
              error: true,
              message: translate['en' ].PLEASETRYLATER,
              errMessage: err_.message,
            })
          } else if (data_) {
            resolve({
              error: false,
              message: translate['en' ].DATAUPDATED,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate['en' ].DATANOTUPDATED,
            });
          }
        }
      );
    });
  }catch (err) {
        logToConsole.error("ACTION: saveAdminHistoryDao error:"+err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
    }
}

const findOneAdminHistoryDao = async (query, lang) => {
  try{
    return new Promise((resolve, reject) => {
      ADMINHISTORY.findOne(
        query,
        {new: true},
        (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: saveAdminHistoryDao error:"+err_)
            resolve({
              error: true,
              message: translate['en' ].PLEASETRYLATER,
              errMessage: err_.message,
            })
          } else if (data_) {
            resolve({
              error: false,
              message: translate['en' ].DATAFOUND,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate['en' ].DATANOTFOUND,
            });
          }
        }
      );
    });
  }catch (err) {
        logToConsole.error("ACTION: saveAdminHistoryDao error:"+err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
    }
}

const updateManyAdminHistoryDao = async (query, data, lang) => {
  try{
    return new Promise((resolve, reject) => {
      ADMINHISTORY.updateMany(
        query,
        data, 
        {new: true},
        (err_, data_) => {
          if (err_) {
            logToConsole.info("ACTION: saveAdminHistoryDao error:"+err_)
            resolve({
              error: true,
              message: translate['en' ].PLEASETRYLATER,
              errMessage: err_.message,
            })
          } else if (data_) {
            resolve({
              error: false,
              message: translate['en' ].DATAUPDATED,
              data: data_,
            });
          } else {
            resolve({
              error: true,
              message: translate['en' ].DATANOTUPDATED,
            });
          }
        }
      );
    });
  }catch (err) {
        logToConsole.error("ACTION: saveAdminHistoryDao error:"+err)
        return {
          error: true,
          message: translate['en' ].SERVERERR,
          errMessage: err.message,
      }
    }
}

module.exports = {
  CFAMValidation,
  CFAMFindPagination,
  CFAM,
  CFAMAggrigate,
  CFAMFIND,
  createAdminAccountDao,
  findAdminDao,
  saveAdminHistoryDao,
  findOneUpdateAdminHistoryDao,
  findOneAdminHistoryDao,
  updateManyAdminHistoryDao
};
