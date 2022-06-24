const { logToConsole } = require('../logger/index.js')
const { createAdminAccountDao, findAdminDao, CFAMAggrigate, findOneAdminHistoryDao, saveAdminHistoryDao, findOneUpdateAdminHistoryDao, updateManyAdminHistoryDao, CFAM } = require('../dao/index.js')
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
const translate = require("../../constants");
const _ = require('lodash');
const { ADMINUSER, ADMINACCOUNT } = require('../models/admin/auth.js');
const jwtCreator = require('../middlewares/jwt');
const { CATEGORY } = require('../models/admin/questions.js');
const { USER } = require('../models/user/auth.js');
const { FAQ } = require('../models/user/help.js');
const { TERMS, PRIVACY, ABOUTUS } = require('../models/admin/content.js');
var ObjectId = require('mongodb').ObjectId; 
const notify = require('../middlewares/notification');
var today = new Date();


//logToFile.info("API: registerAdmin error:", err);
const registerAdmin = async (req, res, next) => {
    let { lang } = req.body
    try {

        let { password, lang } = req.body

        req.body.password = cryptr.encrypt(password)

        let data = await createAdminAccountDao(req.body, res);

        res.status(200).json(data);

    } catch (err) {
        logToConsole.error("API: registerAdmin error:" + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const loginAdmin = async (req, res, next) => {
    let { lang } = req.body
    try {

        let { password, adminName } = req.body

        let data = await findAdminDao({ adminName }, true, lang, 'adminName role password');
        if(data?.error){
            let agg = [
                {
                    $match: { adminName, isActive: true }
                },
                {
                    $lookup: {
                        from: 'AdminRoles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'permmission'
                    }
                },
                {
                    $unwind: "$permmission"
                },
                {
                    $project: {
                        adminName: "$adminName",
                        role: "$adminType",
                        roleId: "$roleId",
                        password: "$password",
                        permmission: "$permmission.permissions"
                    }
                }
            ]
            let sampledata = await CFAMAggrigate(ADMINUSER, 'aggregate', agg , lang);

            data = {
                adminUser: true,
                data: sampledata?.data?.[0] 
            }
        }
        let sessionExist = await findOneAdminHistoryDao({ adminName, isLogout: false }, lang);

        if (data?.data){
            //&& !sessionExist?.data) {
            let isPasswordCurret = (password == cryptr.decrypt(data.data.password)) ? true : false;
            if (isPasswordCurret) {
                let userToken = await jwtCreator(
                    "adminName",
                    data.data.adminName
                );

                if(data?.adminUser){ 
                    result = {
                        ...data.data,
                        token: userToken,
                        adminId: data.data._id
                    };
                }else{
                    result = {
                        ...data.data._doc,
                        token: userToken,
                        adminId: data.data._id
                    };
                }
                

                //Data binding
                data.data = result

                let histo = {
                    ...data.data,
                    adminId: data.data._id
                }
                //API calls
                let historyAPIresult = await saveAdminHistoryDao(histo, lang)

                //messages
                data.error = false,
                data.message = translate[lang || 'en'].LOGINSUCCESS
            } else {
                data.error = true,
                data.message = translate[lang || 'en'].PASSWORDNOTCURRECT
                delete data.data;
            }
        } 
        // else if (sessionExist?.data) {
        //     data.message = translate[lang || 'en'].SESSIONEXIST;
        //     data.error = true;
        //     delete data.data
        // } 
        else {
            data.error = true,
            data.message = translate[lang || 'en'].ADMINNOTFOUND;
        }

        //response
        res.status(200).json(data);

    } catch (err) {
        logToConsole.error("API: loginAdmin error:" + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const logoutAdmin = async (req, res, next) => {
    let { lang } = req.body
    const token = req.header("auth");
    try {

        let confirm = await findOneUpdateAdminHistoryDao({ token }, { isLogout: true, logoutTime: Date.now() }, lang)
        delete confirm.data
        confirm.message = translate[lang || 'en'].LOGOUTED

        //response
        res.status(200).json(confirm);
    } catch (err) {
        logToConsole.error("API: logoutAdmin error:" + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const logoutAllSession = async (req, res, next) => {
    let { lang, adminName, password, token } = req.body
    try {
        let data = await findAdminDao({ adminName }, true, lang);

        if (data?.data) {
            let isPasswordCurret = (password == cryptr.decrypt(data.data.password)) ? true : false;

            if (isPasswordCurret) {
                let confirm = await updateManyAdminHistoryDao({ adminName }, { isLogout: true, logoutTime: Date.now() }, lang)
                delete confirm.data
                confirm.message = translate[lang || 'en'].LOGOUTED

                //response
                res.status(200).json(confirm);
                return
            } else {
                data.message = translate[lang || 'en'].PASSWORDNOTCURRECT
                delete data.data;
            }
        } else {
            data.message = translate[lang || 'en'].ADMINNOTFOUND;
        }

        //response
        res.status(200).json(data);

    } catch (err) {
        logToConsole.error("API: logoutAllSession error:" + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createRole = async (req, res, next) => {
    let { lang } = req.body
    try {
        
        let result = await CFAM(ADMINROLES, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: createRole error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getCreatedAdminRole = async (req, res, next) => {
    let { lang } = req.query
    try {
    
        let result = await CFAM(ADMINROLES, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getCreatedAdminRoleById = async (req, res, next) => {
    let { lang, roleId} = req.query
    try {
    
        let result = await CFAM(ADMINROLES, 'findOne', {
            query: {
                _id: roleId
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editRole = async (req, res, next) => {
    let { lang, roleId } = req.body
    try {
        
        let result = await CFAM(ADMINROLES, 'findOneAndUpdate', {
            query: {
                _id: roleId
            },
            update: req.body,
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createAdminUser = async (req, res, next) => {
    let { lang, adminId, adminName, adminType, roleId, password } = req.body
    try {

        let roles = await CFAM(ADMINROLES, 'findOne', {
            query: {
                _id: roleId
            }
        }, lang)

        
        let data = {
            adminName,
            adminType: roles?.data?.role,
            password: cryptr.encrypt(password),
            roleId,
            createdBy: adminId,
            creatorType: '_superAdmin_'
        }

        let result = await CFAM(ADMINUSER, 'create', data, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editAdminUser = async (req, res, next) => {
    let { lang, adminId, adminName, adminType, roleId, password, adminUserId } = req.body
    try {
        
        let roles = await CFAM(ADMINROLES, 'findOne', {
            query: {
                _id: roleId
            }
        }, lang)

        let data = {
            adminName,
            adminType: roles?.data?.role,
            password: cryptr.encrypt(password),
            roleId,
            createdBy: adminId,
            creatorType: '_superAdmin_'
        }

        let result = await CFAM(ADMINUSER, 'findOneAndUpdate', {
            query: {
                _id: adminUserId
            },
            update: data
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editAdminUser error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllAdminUser = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(ADMINUSER, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAdminUser error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createCategory = async (req, res, next) => {
    let { lang, categoryName, subCategory, processName } = req.body
    try {
        
        let data = {
            categoryName,
            processName,
            subCategory: subCategory.map( item => {
                return { subCategoryName: item } 
            })
        }

        let result = await CFAM(CATEGORY, 'create', data, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: createCategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editCategory = async (req, res, next) => {
    let { lang, catId, categoryName, subCategory, processName } = req.body
    try {
        
        let data = {
            query: {
                _id: catId
            },
            update: {
                categoryName,
                processName,
                subCategory: subCategory.map( item => {
                    return { subCategoryName: item } 
                })
            }
        }

        let result = await CFAM(CATEGORY, 'findOneAndUpdate', data, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editCategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteCategory = async (req, res, next) => {
    let { lang, catId } = req.body
    try {
        
        let result = await CFAM(CATEGORY, 'findOneAndRemove', { _id: catId}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllCategory_Subcategory = async (req, res, next) => {
    let { lang } = req.query
    let { adminId } = req.auth
    try {
        
        let letAgg = [
            {
                $project: {
                    categoryName: "$categoryName",
                    processName: "$processName",
                    subCategory: {
                        "$map": { 
                            "input": "$subCategory", 
                            "as": "sub", 
                            "in": { 
                                "subCategoryName": "$$sub.subCategoryName",
                                "_id": "$$sub._id",
                                "isOn": "$$sub.isOn",
                            } 
                        }
                    },
                    isOn: "$isOn"
                }
            }
        ];

        let result = await CFAMAggrigate(CATEGORY, 'aggregate', letAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllCategory_Subcategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const updateCatStatus = async (req, res, next) => {
    let { lang, catId, subCatId, key, isOn } = req.body
    try {
        let result;
        let data;
        
        if(key == 'category'){
            data = {
                query: {
                    _id: catId
                },
                update: {
                    isOn: isOn
                }
            }
        }else if(key == "subcategory"){
            data = {
                query: {
                    _id: catId,
                    "subCategory._id": new ObjectId(subCatId)
                },
                update: {
                    $set: {
                        "subCategory.$.isOn": isOn 
                    }
                }
            }
        }else{
            result = {
                error: true,
                message: translate[lang || 'en'].PROVIDEVALID
            }
        }
        
        result = await CFAM(CATEGORY, 'findOneAndUpdate', data, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteCategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createQuestionField = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(QUESTIONS, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: createQuestionField error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};


const editQuestionField = async (req, res, next) => {
    let { lang, fieldId } = req.body
    try {

        let result = await CFAM(QUESTIONS, 'findOneAndUpdate', {
            query: {
                _id: fieldId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editQuestionField error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllQuestionField = async (req, res, next) => {
    let lang = req.header("lang")

    try {

        let result = await CFAM(QUESTIONS, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllQuestionField error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const addQuestionToCategory = async (req, res, next) => {
    let { lang, categoryId, subCategoryId, questionId, valuesList } = req.body
    try {

        let result = await CFAM(CATEGORY, 'findOneAndUpdate', {
            query: {
                _id: categoryId,
                "subCategory._id": new ObjectId(subCategoryId)
            },
            update: {
                $set: {
                    "subCategory.$.questionId": questionId,
                    "subCategory.$.valuesList": valuesList
                }
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: addQuestionToCategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editAddedQuestions = async (req, res, next) => {
    let { lang, categoryId, subCategoryId, questionId, valuesList } = req.body
    try {

        let result = await CFAM(CATEGORY, 'findOneAndUpdate', {
            query: {
                _id: categoryId,
                "subCategory._id": new ObjectId(subCategoryId)
            },
            update: {
                $set: {
                    "subCategory.$.questionId": questionId,
                    "subCategory.$.valuesList": valuesList
                }
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editAddedQuestions error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteSubcategory = async (req, res, next) => {
    let { lang, categoryId, subCategoryId } = req.body
    try {

        let result = await CFAM(CATEGORY, 'findOneAndUpdate', {
            query: {
                _id: categoryId,
            },
            update: {
                $pull: {
                    "subCategory": {
                        _id: new ObjectId(subCategoryId)
                    }
                }
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteSubcategory error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllAddedQuestionById = async (req, res, next) => {
    let lang = req.header("lang")
    let catId = req.header("catId")
    let subCatId = req.header("subCatId")
    try {

        let letAgg = [
            {
                $match: {
                    _id: parseInt(catId),
                }
            },
            {$unwind: '$subCategory'},
            {
                $match: {
                    "subCategory._id": new ObjectId(subCatId)
                } 
            },
            {   
                $lookup: {
                    from: 'Questions',
                    localField: 'subCategory.questionId',
                    foreignField: '_id',
                    as: 'questions'
                }
            },
            {
                $project: {
                    questionList: "$questions",
                    valuesList: 
                    {
                        "$map": { 
                            "input": "$subCategory.valuesList", 
                            "as": "sub", 
                            "in": { 
                                "feldName": "$$sub.feldName",
                                "valueSet": "$$sub.valueSet",
                                "_id": "$$sub._id",
                            } 
                        }
                    }
                }
            }
        ];

        let result = await CFAMAggrigate(CATEGORY, 'aggregate', letAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getUserList = async (req, res, next) => {
    let { lang, catId, subCatId } = req.query
    try {
    
        let letAgg = [
            {
                $match: {

                }
            }
        ];

        let result = await CFAMAggrigate(USER, 'aggregate', letAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getActivePost = async (req, res, next) => {
  let lang = req.header("lang")
  try {
    
        let letsAgg = [
            {
              $match: {
                isActive: true
              }
            }
        ]
      
        let result = await CFAMAggrigate(POSTS, 'aggregate', letsAgg, lang)
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getInactivePost = async (req, res, next) => {
    let { lang } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                isActive: false
              }
            }
        ]
    
        let result = await CFAMAggrigate(POSTS, 'aggregate', letsAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getActivePostByUserId = async (req, res, next) => {
    let { lang, userId } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                userId: parseInt(userId),
                isActive: true
              }
            }
          ]
      
        let result = await CFAMAggrigate(POSTS, 'aggregate', letsAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getInactivePostByUserId = async (req, res, next) => {
    let { lang, userId } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                userId: parseInt(userId),
                isActive: false
              }
            }
        ]
    
        let result = await CFAMAggrigate(POSTS, 'aggregate', letsAgg, lang)

        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getActivetask = async (req, res, next) => {
    let { lang, catId, subCatId } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                isActive: true
              }
            }
        ]
      
        let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getInactiveTask = async (req, res, next) => {
    let { lang } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                isActive: false
              }
            }
        ]
    
        let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getActiveTaskByUserId = async (req, res, next) => {
    let { lang, userId } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                userId: parseInt(userId),
                isActive: true
              }
            }
          ]
      
        let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getInactiveTaskByUserId = async (req, res, next) => {
    let { lang, userId } = req.query
    try {
    
        let letsAgg = [
            {
              $match: {
                userId: parseInt(userId),
                isActive: false
              }
            }
        ]
    
        let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllAddedQuestionById error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createSellerSubscription = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_SELLER, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: createSellerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllSellerSubscription = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(SUBSCRIPTION_SELLER, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllSellerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editSellerSubscription = async (req, res, next) => {
    let { lang, subId } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_SELLER, 'findOneAndUpdate', {
            query: {
                _id: subId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editSellerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const statusUpdateSellerSubscription = async (req, res, next) => {
    let { lang, subId, status } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_SELLER, 'findOneAndUpdate', {
            query: {
                _id: subId
            },
            update: {
                isActive: status
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: statusUpdateSellerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteSellerSubscription = async (req, res, next) => {
    let { lang, subId } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_SELLER, 'findOneAndRemove', {
                _id: subId
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteSellerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createTaskerSubscription = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_TASKER, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: createTaskerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editTaskerSubscriotion = async (req, res, next) => {
    let { lang, subId } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_TASKER, 'findOneAndUpdate', {
            query: {
                _id: subId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editTaskerSubscriotion error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const statusUpdateTaskerSubscription = async (req, res, next) => {
    let { lang, subId, status } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_TASKER, 'findOneAndUpdate', {
            query: {
                _id: subId
            },
            update: {
                isActive: status
            }
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: statusUpdateTaskerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteTaskerSubscription = async (req, res, next) => {
    let { lang, subId } = req.body
    try {

        let result = await CFAM(SUBSCRIPTION_TASKER, 'findOneAndRemove', {
                _id: subId
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteTaskerSubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllTaskersubscription = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(SUBSCRIPTION_TASKER, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAllTaskersubscription error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const postFAQ = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(FAQ, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: postFAQ error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getFAQ = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(FAQ, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getFAQ error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editFAQ = async (req, res, next) => {
    let { lang, questionId } = req.body
    try {

        let result = await CFAM(FAQ, 'findOneAndUpdate', {
            query: {
                _id: questionId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editFAQ error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteFAQ = async (req, res, next) => {
    let { lang, questionId } = req.body
    try {

        let result = await CFAM(FAQ, 'findOneAndRemove', {
            _id: questionId,
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: deleteFAQ error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

//Coupon
const addNewCoupon = async (req, res, next) => {
    let { lang } = req.body
    try {
        let data = req.body

        result = await CFAM(COUPON, 'create', data, lang)

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editCoupon = async (req, res, next) => {
    let { lang, couponId } = req.body
    try {
        let data = {
            query: {
                _id: couponId,
            },
            update: req.body,

        }

        let result = await CFAM(COUPON, 'findOneAndUpdate', data, lang)

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: editCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteOneCoupon = async (req, res, next) => {
    let { lang, couponId } = req.body
    try {
        let data = { _id: couponId, }

        let result = await CFAM(COUPON, 'findOneAndRemove', data, lang)

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: deleteOneCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAllCoupon = async (req, res, next) => {
    let { lang } = req.query
    try {
        let aggregate = [
            {
                $match: {

                }
            },
            {
                $project: {
                    title: "$title",
                    validFrom: { $dateToString: { format: "%Y-%m-%d", date: "$validFrom" } },     
                    validTo: { $dateToString: { format: "%Y-%m-%d", date: "$validTo" } },
                    description: "$description",
                    code: "$code",
                    discount: "$discount",
                    upToAmount: "$upToAmount",
                    minValueTill: "$minValueTill",
                    useCount: "$useCount",
                    isOn: "$isOn",
                    isSpecial: "$isSpecial",
                    specialUserId: "$specialUserId",
                    createdAt:"$createdAt",
                    updatedAt:"$updatedAt",
                    isExpired: {
                        $cond: {
                            if: {
                                $lte: ["$validTo", today]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            { $sort : { createdAt : -1 } }
        ]
        result = await CFAMAggrigate( COUPON, "aggregate", aggregate, lang );
        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: getAllCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAdminNotifications = async (req, res, next) => {
    let { lang, adminId } = req.query
    try {
        let result = await CFAM(ADMINACCOUNT, 'findOne', {
            query: {
                _id: adminId,
            },
            select: 'adminName role'
        }, lang)

        let notifycation = await notify.get(adminId, result?.data?.role, lang)

        //response
        res.status(200).json(notifycation);
    } catch (err) {
        logToConsole.error("API: getRecivedCards error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const updateNotificationStatus = async (req, res, next) => {
    let { lang, notificationId, isViewed } = req.body
    try {

        let result = await CFAM( NOTIFICATION, 'findOneAndUpdate', {
            query: {
                _id: new mongodb.ObjectId(notificationId),
            },
            update: {
                isViewed
            }
        } , lang) 

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: getRecivedCards error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const createBadges = async (req, res, next) => {
    let { lang } = req.body
    try {
        let data = req.body

        result = await CFAM(BADGES, 'create', data, lang)

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: deleteCars error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAddedBadges = async (req, res, next) => {
    let lang = req.header("lang")
    let { adminId } = req.auth;

    try {
        let aggregate = [
            {
                $project: {
                    title: "$title",
                    description: "$description",
                    iconImage: "$iconImage",
                    isOn: "$isOn"
                }
            },
            { $sort : { createdAt : -1 } }
        ]
        result = await CFAMAggrigate( BADGES, "aggregate", aggregate, lang );
        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: getAllCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editBadges = async (req, res, next) => {
    let { lang, badgeId } = req.body
    try {
        let data = {
            query: {
                _id: badgeId,
            },
            update: req.body,

        }

        let result = await CFAM(BADGES, 'findOneAndUpdate', data, lang)

        delete result.data

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: editCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const deleteBadges = async (req, res, next) => {
    let { lang, badgeId } = req.body
    try {
        let data = { _id: badgeId, }

        let result = await CFAM(BADGES, 'findOneAndRemove', data, lang)

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: deleteOneCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const updateBadgeStatus = async (req, res, next) => {
    let { lang, badgeId, isOn } = req.body
    try {
        let data = {
            query: {
                _id: badgeId,
            },
            update: {
                $set: {
                    isOn
                }
            }
        }

        let result = await CFAM(BADGES, 'findOneAndUpdate', data, lang)

        delete result.data

        //response
        res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: editCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getBadgeRequestByuserId = async (req, res, next) => {
    let lang = req.header("lang")
    let userId = req.header("userId")
    let { adminId } = req.auth;

    try {
        let letsAgg = [
            {
              $match: {
                $or: [
                    {
                        applyedUser: {
                            $in: [ parseInt(userId)]
                        }
                    },
                    {
                        approvedUser: {
                            $in: [ parseInt(userId) ]
                        }
                    }
                ]
              },
            },
            {
              $project: {
                title: "$title",
                description: "$description",
                iconImage: "$iconImage",
                isApplied: {
                  $cond: [
                    {
                      $in: [ parseInt(userId), "$applyedUser" ]
                    }, true, false]
                },
                isAprroved: {
                  $cond: [
                    {
                      $in: [ parseInt(userId), "$approvedUser" ]
                    }, true, false]
                }
              }
            },
            {
              $sort: { createdAt: -1 }
            }
          ]
      
          let result = await CFAMAggrigate(BADGES, 'aggregate', letsAgg, lang)
      
          //response
          res.status(200).json(result);
    } catch (err) {
        logToConsole.error("API: getAllCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const updateStatusForRequest = async (req, res, next) => {
    let { lang, badgeId, approvedStatus, userId } = req.body
    try {
        let letsAgg = [
            {
                $match: {
                _id: parseInt(badgeId),
                $expr: {
                    $in: [parseInt(userId), "$applyedUser"]
                }
                },
            }
        ]
    
        let find = await CFAMAggrigate(BADGES, 'aggregate', letsAgg, lang)

        if(find?.error == false){
            let result = await CFAM(BADGES, 'findOneAndUpdate', {
                query: {
                    _id: badgeId
                },
                update: {
                    $push: approvedStatus == "approved" ? {
                        approvedUser: parseInt(userId)
                    }: {
                        rejectedUser: parseInt(userId)
                    },
                    $pull: 
                    approvedStatus == "approved" ? {
                        rejectedUser: parseInt(userId)
                    }: {
                        approvedUser: parseInt(userId)
                    } 
                }
            }, lang)
    
            delete result.data
    
            //response
            res.status(200).json(result);
        }else{
            //response
            res.status(200).json({
                error: true,
                message: "User not registered with this badge"
            });
        }   
       
    } catch (err) {
        logToConsole.error("API: editCoupon error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};


//Terms
const addTermsAndConditons = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(TERMS, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: addTermsAndConditons error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getTermsAndConditons = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(TERMS, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getTermsAndConditons error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editTermsAndConditons = async (req, res, next) => {
    let { lang, termsId } = req.body
    try {

        let result = await CFAM(TERMS, 'findOneAndUpdate', {
            query: {
                _id: termsId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editTermsAndConditons error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

//Privacy Policy
const addPrivacy = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(PRIVACY, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: addPrivacy error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getPrivacy = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(PRIVACY, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getPrivacy error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editPrivacy = async (req, res, next) => {
    let { lang, privacyId } = req.body
    try {

        let result = await CFAM(PRIVACY, 'findOneAndUpdate', {
            query: {
                _id: privacyId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editPrivacy error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

//About Us Content
const addAboutUs = async (req, res, next) => {
    let { lang } = req.body
    try {

        let result = await CFAM(ABOUTUS, 'create', req.body, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: addAboutUs error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const getAboutUs = async (req, res, next) => {
    let { lang } = req.query
    try {

        let result = await CFAM(ABOUTUS, 'find', {}, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: getAboutUs error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

const editAboutUs = async (req, res, next) => {
    let { lang, aboutId } = req.body
    try {

        let result = await CFAM(ABOUTUS, 'findOneAndUpdate', {
            query: {
                _id: aboutId
            },
            update: req.body
        }, lang)
        
        //response
        res.status(200).json(result);
        
    } catch (err) {
        logToConsole.error("API: editAboutUs error: " + err)
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].SERVERERR,
            errMessage: err.message,
        });
    }
};

module.exports = {
getAboutUs,
    editAboutUs,
    addAboutUs,
    getPrivacy,
    editPrivacy,
    addPrivacy,
    editTermsAndConditons,
    getTermsAndConditons,
    addTermsAndConditons,
    updateStatusForRequest,
    getBadgeRequestByuserId,
    updateBadgeStatus,
    deleteBadges,
    editBadges,
    getAddedBadges,
    createBadges,
    editAddedQuestions,
    getAdminNotifications,
    updateNotificationStatus,
    deleteOneCoupon,
    getAllCoupon,
    editCoupon,
    addNewCoupon,
    deleteFAQ,
    editFAQ,
    getFAQ,
    postFAQ,
    getAllTaskersubscription,
    deleteTaskerSubscription,
    statusUpdateTaskerSubscription,
    editTaskerSubscriotion,
    createTaskerSubscription,
    deleteSellerSubscription,
    statusUpdateSellerSubscription,
    editSellerSubscription,
    getAllSellerSubscription,
    createSellerSubscription,
    getActivetask,
    getInactiveTask,
    getActiveTaskByUserId,
    getInactiveTaskByUserId,
    getInactivePostByUserId,
    getActivePostByUserId,
    getInactivePost,
    getActivePost,
    getUserList,
    getAllAddedQuestionById,
    deleteSubcategory,
    addQuestionToCategory,
    getAllQuestionField,
    editQuestionField,
    createQuestionField,
    updateCatStatus,
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    logoutAllSession,
    createCategory,
    createRole,
    getCreatedAdminRole,
    getCreatedAdminRoleById,
    editRole,
    createAdminUser,
    editAdminUser,
    getAllAdminUser,
    editCategory,
    deleteCategory,
    getAllCategory_Subcategory
};
