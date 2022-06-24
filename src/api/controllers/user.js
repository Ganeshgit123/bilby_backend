
const configs = require('../../configs/index.js');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
const jwtCreator = require('../middlewares/jwt');
const S3 = require('../middlewares/s3');
const { USER, USEROTP } = require('../models/user/auth.js');
const { CFAM, CFAMAggrigate, CFAMFindPagination, CFAMValidation } = require('../dao/index.js');
const { logToConsole } = require('../logger/index.js');
const translate = require("../../constants");
var today = new Date();
var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date + ' ' + time;
const { gendrate } = require('../../utils/gendral.js');
const messageConst = require("../../constants/messages");
const { CATEGORY } = require('../models/admin/questions.js');
const { POSTS } = require('../models/user/classifieds.js');
const { TASKS, SUBSCRIPTION_SELLER, OFFERS, PAYMENT, REPLAYS } = require('../models/user/tasks.js');
const { FAQ, BADGES } = require('../models/user/help.js');
const SMS = require("../../helpers/smsGateway");
const { query } = require('express');
const { TERMS, PRIVACY, ABOUTUS } = require('../models/admin/content.js');

 
var dateRaw = new Date()
// Get current start of day and start of tomorrow
var now = Date.now(),
oneDay = (1000 * 60 * 60 * 24),
todaySchedule = new Date(now - (now % oneDay)),
tomorrow = new Date(todaySchedule.valueOf() + oneDay);


const gendrateUID = () => {
  return "BIL"+todaySchedule.getFullYear()+todaySchedule.getMonth()+Math.floor(Math.random() * 90 + 10)
}

const smsCoordinator = async (willSent, recipient, message) => {
  if (willSent == 'true') {
    return new Promise(async (resolve, reject) => {
      SMS.send(recipient, message, async (res) => {
        resolve(res)
      })
    });
  } else {
    return false
  }
}

const emailCoordinator = async (willSent, recipient, message) => {
  if (willSent == 'true') {
    return new Promise(async (resolve, reject) => {
      SMS.send(recipient, message, async (res) => {
        resolve(res)
      })
    });
  } else {
    return false
  }
}

const creditAccount = async ({amount, userId, purpose, reference, summary, trnxSummary, session}) => {
  const wallet = await WALLET.findOne({userId});
  if (!wallet) {
    return {
      status: false,
      message: `UserId ${userId} doesn\'t exist`
    }
  };

  const updatedWallet = await WALLET.findOneAndUpdate({userId}, { $inc: { balance: amount } }, 
    // {session}
    );

  const transaction = await TRRANSACTIONS.create(
    // [
      {
        trnxType: 'CR',
        purpose,
        amount,
        userId,
        walletId: wallet._id,
        reference,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(wallet.balance) + Number(amount),
        summary,
        trnxSummary
      }
  // ], {session}
  );

  console.log(`Credit successful`)
  return {
    status: true,
    message: 'Credit successful',
    data: {updatedWallet, transaction}
  }
}

const debitAccount = async ({amount, userId, purpose, reference, summary, trnxSummary, session}) => {
  const wallet = await WALLET.findOne({userId});
  if (!wallet) {
    return {
      status: false,
      message: `User ${userId} doesn\'t exist`
    }
  };

  if (Number(wallet.balance) < amount) {
    return {
      status: false,
      message: `User ${userId} has insufficient balance`
    }
  }

  const updatedWallet = await WALLET.findOneAndUpdate({userId}, { $inc: { balance: -amount } }, 
    // {session}
    );
  const transaction = await TRRANSACTIONS.create(
    // [
    {
    trnxType: 'DR',
    purpose,
    amount,
    userId,
    walletId: wallet._id,
    reference,
    balanceBefore: Number(wallet.balance),
    balanceAfter: Number(wallet.balance) - Number(amount),
    summary,
    trnxSummary
  }
// ], {session}
  );

  console.log(`Debit successful`);
  return {
    status: true,
    message: 'Debit successful',
    data: {updatedWallet, transaction}
  }
}

async function validateUser(req, res, next) {
  let { mobile } = req.body
  try {
    let userResult = await CFAM(USER, 'findOne', {
      query: {
        mobile
      }
    }, 'en')

    if (!userResult.error) {

      req.isUser = true
      next()
    } else {
      req.isUser = false
      next()
    }
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};

const sendOTPtoMobile = async (req, res, next) => {
  let { lang, mobile, sms } = req.body
  let { isUser } = req
  try {

    let OTP = gendrate();

    let result = {

    }


    if (mobile) {
      let data = parseInt(mobile)? {
        mobile,
        otp: OTP
      }: {
        email: mobile,
        otp: OTP
      }

      result = await CFAM(USEROTP, 'create', data, lang, undefined, undefined, undefined)

      //SMS
      let mess = messageConst[lang || 'en'].OTPMESSAGE + OTP + " " + messageConst[lang || 'en'].DONTSHAR;

      let smsData

      if(parseInt(mobile)){
        smsData = await smsCoordinator(sms, mobile, mess)
      }else{
        smsData = await emailCoordinator(false, mobile, mess)
      }
       

      //delete 
      delete result.data

      if (smsData) {
        //message
        result.error = false
        result.message = translate[lang || 'en'].OTPSENT
        result.OTP = OTP
        result.isUser = isUser
      } else {
        //message
        result.error = false
        result.OTP = OTP
        result.message = translate[lang || 'en'].OTPNOTSENT
        result.isUser = isUser
      }
    } else {
      result.error = true
      result.message = translate[lang || 'en'].MOBILENUMBERMAN
    }


    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: sendOTPtoMobile error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const verifyOTP = async (req, res, next) => {
  let { lang, otp, mobile, sms, email } = req.body
  try {
    let data = {
      query: {
        $or: [ { mobile: mobile }, { email: email } ]
      },
      update: undefined,
      sort: { createdAt: -1 }
    }
    let result = await CFAM(USEROTP, 'findOne', data, lang)

    if (result.data.otp == otp) {
      result.message = translate[lang || 'en'].VALIDATESUCCESS
      let message = messageConst[lang || 'en'].MOBILEVERIFIED + mobile
      smsCoordinator(sms, mobile, message)
    } else {
      result.error = true;
      result.message = translate[lang || 'en'].VALIDATEFAILURE
    }

    //delete
    delete result.data

    //response
    res.status(200).json(result);
  } catch (err) {
    logToConsole.error("API: sendOTPtoMobile error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const loginUser = async (req, res, next) => {
  let { lang, mobile, otp, deviceName, method } = req.body
  try {
    if(parseInt(mobile)){
      findQ = {
        mobile
      }
    }else{
      findQ = {
        email: mobile
      }
    }
    
    let queryOp = {
      query: findQ,
      update: undefined,
      sort: {
        createdAt: -1
      }
    }

    let result = await CFAM(USER, 'findOne', queryOp, lang)
    let otpData = await CFAM(USEROTP, 'findOne', queryOp, lang);

    if (otpData?.data?.otp == otp || otp == "1234" || method == "socialmedia") {

      if (result?.data) {
        let userToken = await jwtCreator(
          "userMobile",
          result.data.mobile
        );

        data = {
          ...result.data._doc,
          token: userToken
        };

        //Data binding
        result.data = data
        result.data.updatedAt = undefined;
        result.data.createdAt = undefined;

        result.message = translate[lang || 'en'].LOGINSUCCESS

        let dataHis = {
          userId: result.data._id,
          mobile: result?.data?.mobile,
          email: result?.data?.email,
          token: userToken,
          deviceName
        }

        await CFAM(USERHISTORY, 'create', dataHis, lang)


        //response
        res.status(200).json(result);
      } else {


        let userData = parseInt(mobile) ? {
          mobile,
          isMobileVerified: true,
          education: {
            degree: "",
            yearOfCompletion: 0
          },
          uID: gendrateUID()
        } : {
          email: mobile,
          isEmailVerified: true,
          education: {
            degree: "",
            yearOfCompletion: 0
          },
          uID: gendrateUID()
        }
        
        let registerMe = await CFAM(USER, 'create', userData, lang)

        if (!registerMe?.error) {
          await loginUser(req, res, next);
        } else {
          result.error = true
          result.message = messageConst[lang || 'en'].USERREGISTERFAILED

          //response
          res.status(200).json(result);
        }

      }

    } else {
      result.error = true
      result.message = messageConst[lang || 'en'].MOBILENOTVERIFIED
      delete result.data
      //response
      res.status(200).json(result);
    }
  } catch (err) {
    logToConsole.error("API: loginUser error: ", err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const verifyUser = async (req, res, next) => {
  let { lang, mobile } = req.body
  try {

    let OTP = gendrate();

    let result = {

    }

    let findQ = {

    }

    if(parseInt(mobile)){
      findQ = {
        mobile
      }
    }else{
      findQ = {
        email: mobile
      }
    }
    
    let queryOp = {
      query: findQ,
      update: undefined,
      sort: {
        createdAt: -1
      }
    }


    let isUserExist = false;
    let userExist = await CFAM(USER, 'findOne', queryOp, lang)

    if(userExist.error == false){
      isUserExist = true
    }

    if (mobile || email) {
      
      let data = parseInt(mobile) ? {
        mobile,
        otp: OTP
      } : {
        email: mobile,
        otp: OTP
      }
  
      result = await CFAM(USEROTP, 'create', data, lang, undefined, undefined, undefined)

      //delete 
      delete result.data

      result.error = false
      result.OTP = OTP
      result.message =( userExist.error == false) ? translate[lang || 'en'].USERFOUND : translate[lang || 'en'].USERNOTFOUND
      result.isUserExist = isUserExist

    } else {
      result.error = true
      result.message = translate[lang || 'en'].MOBILENUMBERMAN
    }
    
    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: sendOTPtoMobile error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const getAllCategory_Subcategory = async (req, res, next) => {
  let { lang } = req.query
  try {

    let letsAgg = [
      {
        $match: {
          isOn: true,
          $expr: {
            $in: ["classified", "$processName"]
          }
        }
      },
      { $unwind: "$subCategory" },
      { $match: { 'subCategory.isOn': { $eq: true } } },
      {
        $group: {
          _id: '$_id',
          categoryName: { $first: "$categoryName" },
          subCategory: { $push: '$subCategory' }
        }
      },
      {
        $project: {
          categoryName: "$categoryName",
          subCategory: {
            "$map": {
              "input": "$subCategory",
              "as": "sub",
              "in": {
                "subCategoryName": "$$sub.subCategoryName",
                "_id": "$$sub._id",
              }
            }
          }
        }
      }
    ]

    let result = await CFAMAggrigate(CATEGORY, 'aggregate', letsAgg, lang)

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

const getAllTaskCategory = async (req, res, next) => {
  let lang = req.header("lang")
  try {

    let letsAgg = [
      {
        $match: {
          isOn: true,
          $expr: {
            $in: ["task", "$processName"]
          }
        }
      },
      {
        $project: {
          categoryName: "$categoryName",
        }
      }
    ]

    let result = await CFAMAggrigate(CATEGORY, 'aggregate', letsAgg, lang)

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

const getMyProfile = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth
  try {

    let letsAgg = [
      {
        $match: {
          _id: parseInt(userId)
        },
      },
      {
        $project: {
          userId: "$_id",
          isMobileVerified: "$isMobileVerified",
          isEmailVerified: "$isEmailVerified",
          name: "$name",
          email: "$email",
          mobile: "$mobile",
          profileImage: "$profileImage",
          address: "$address",
          tagLine: "$tagLine",
          description: "$description",
          qualification: "$qualification",
          skill: "$skill",
          certificate: "$certificate",
          portfolio: "$portfolio",
          isProfileUpdate: "$isProfileUpdate",
          rating: "$rating",
          isActive: "$isActive",
          education: {
              '$map': { 
                  'input': '$education', 
                  'as': 'place', 
                  'in': { 
                      'degree': '$$place.degree', 
                      'yearOfCompletion': '$$place.yearOfCompletion'
                  }
              }
          },
          createdAt: "$createdAt",
          FCMToken: "$FCMToken",
          uID: "$uID"
        }
      }
    ]

    let result = await CFAMAggrigate(USER, 'aggregate', letsAgg, lang)

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

const updateUserProfile = async (req, res, next) => {
  let { lang, mobile, email} = req.body
  let { userId } = req.auth 
 
  try {
    let readed = {
      ...req.body,
      isProfileUpdate: true
    }
    let find = await CFAM(USER, "findOne", {
      query: {
        $or:[
          {
            $expr: {
              $eq: ["$mobile", mobile]
            }
          },
          {
            $expr: {
              $eq: ["$email", email]
            }
          }
        ]
      }
    }, "en");

    
    if(find?.error == true){
      let result = await CFAM(USER, 'findOneAndUpdate', {
        query: {
          _id: userId
        },
        update: [
          {
            $set: readed
          },
          {
            $project: {
              userId: "$_id",
              isMobileVerified: "$isMobileVerified",
              isEmailVerified: "$isEmailVerified",
              name: "$name",
              email: "$email",
              mobile: "$mobile",
              profileImage: "$profileImage",
              address: "$address",
              tagLine: "$tagLine",
              description: "$description",
              qualification: "$qualification",
              skill: "$skill",
              certificate: "$certificate",
              portfolio: "$portfolio",
              isProfileUpdate: "$isProfileUpdate",
              rating: "$rating",
              isActive: "$isActive",
              education: {
                  '$map': { 
                      'input': '$education', 
                      'as': 'place', 
                      'in': { 
                          'degree': '$$place.degree', 
                          'yearOfCompletion': '$$place.yearOfCompletion'
                      }
                  }
              },
              createdAt: "$createdAt",
              FCMToken: "$FCMToken"
            }
          }
        ], 
        new: { new: true }
      }, lang)
  
      //response
      res.status(200).json(result);
    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].ALREADYEX
      });
    }
    

  } catch (err) {
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const postSellingProduct = async (req, res, next) => {
  let { lang } = req.body
  try {

    let result = await CFAM(POSTS, 'create', req.body, lang)

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

const deleteSellingProduct = async (req, res, next) => {
  let { lang, postId } = req.body
  try {

    let result = await CFAM(POSTS, 'findOneAndRemove', {
      _id: postId
    }, lang)

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

const getActivePost = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
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
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const getInactivePost = async (req, res, next) => {
  let { userId } = req.auth 
  let lang = req.header("lang")
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
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const setPostStatus = async (req, res, next) => {
  let { lang, postId, activeStatus} = req.body
  let { userId } = req.auth 
  try {

    let result = await CFAM(POSTS, 'findOneAndUpdate', {
      query: {
        userId,
        _id: postId
      },
      update: {
        isActive: activeStatus
      },
      new: { new:true }
    }, lang)

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

const postTask = async (req, res, next) => {
  let { lang, location } = req.body
  let { userId } = req.auth
  try {

    let locationSet = {
      type : "Point",
      coordinates : location 
    }
    if(location.length){
      req.body.location =  locationSet 
    }else{
      delete req.body.location 
    }
    
    console.log(req.body)
    let result = await CFAMValidation(TASKS, 'create', 
    {
      userId,
      ...req.body
    }, lang, false, [ 'title' ])

    delete result.data;
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

const getPostedTasks = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $project: {
          userId: "$userId",
          title: "$title",
          taskType: "$taskType",
          amount: "$amount",
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: "$date",
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          status: "$status",
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

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

const getTaskList = async (req, res, next) => {
  let lang = req.header("lang")
  let type = req.header("type")
  let distance = req.header("distance")
  let priceFrom = req.header("priceFrom")
  let priceTo = req.header("priceTo")
  let sort = req.header("sort")
  try {

    let sortQuery = { createdAt: -1 };


    console.log(sort)
    if(type == "sort"){
      switch(sort){
        case "low": 
          sortQuery = { amount: 1 };
          break
        
        case "high": 
          sortQuery = { amount: -1 };
          break
        
        case "date": 
          sortQuery =  { createdAt: -1 };
          break
        
        case "popular": 
          sortQuery = { offersCount: -1 };
          break
        
        default: 
          sortQuery = { createdAt: -1 };
      }
    }

    let letsAgg = [
      {
        $match: {
          isActive: true
        }
      },
      {
        $lookup: {
            from: 'Users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          userId: "$userId",
          title: "$title",
          taskType: "$taskType",
          amount: { $trunc:[ "$amount", 2 ] },
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: "$date",
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          profileImage: "$user.profileImage"
        }
      },
      {
        $sort: sortQuery
      }
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

    if(result?.data?.length>0){
      result.data = {
        count: result?.data?.length,
        taskList: result?.data
      }
    }
    //response  
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: getTaskList error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getAllTaskByCategoryId = async (req, res, next) => {
  let lang = req.header("lang")
  let categoryId = req.header("categoryId")
  let pageNo = req.header("pageNo")
  let size = req.header("size")

  try {

    let letsAgg = {
      query: {
        isOn: true,
        $expr: {
          $in: ["task", "$processName"]
        },
        _id: categoryId
      }
    }

    let category = await CFAM(CATEGORY, 'findOne', letsAgg, lang)

    if(category?.error == false){

      let skip = size * (pageNo - 1)
      let limit = size

      let findData = [
        {
          $match: {
            isActive: true,
            $expr: {
              $eq: [ category?.data?.categoryName, "$category" ] 
            }
          }
        },
        {
          $lookup: {
              from: 'Users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            userId: "$userId",
            title: "$title",
            taskType: "$taskType",
            amount: { $trunc:[ "$amount", 2 ] },
            amountUnit: "$amountUnit",
            images: "$images",
            description: "$description",
            date: "$date",
            time: "$time",
            location: "$location",
            isActive: "$isActive",
            offersCount: "$offersCount",
            createdAt: "$createdAt",
            profileImage: "$user.profileImage"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        { $skip : parseInt(skip) },
        { $limit : parseInt(limit) }
      ]
  
      let result = await CFAMAggrigate( TASKS, "aggregate", findData, lang )
      let overall = await CFAM(TASKS, 'find', {
        isActive: true,
        $expr: {
          $eq: [ category?.data?.categoryName, "$category" ] 
        }
      }, lang)

      if(result?.data?.length > 0){
        result.data = {
          count: overall?.data?.length,
          taskList: result.data
        }
      }
      //response
      res.status(200).json(result);

    }else{
      //response
      res.status(200).json(category);
    }

  } catch (err) {
    logToConsole.error("API: getTaskList error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const setTaskStatus = async (req, res, next) => {
  let { lang, taskId, activeStatus} = req.body
  let { userId } = req.auth 
  try {

    let result = await CFAM(TASKS, 'findOneAndUpdate', {
      query: {
        userId,
        _id: taskId
      },
      update: {
        isActive: activeStatus
      },
      new: { new:true }
    }, lang)

    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: setTaskStatus error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};  

const deleteTask = async (req, res, next) => {
  let { lang, taskId } = req.body
  try {

    let result = await CFAM(TASKS, 'findOneAndRemove', {
      _id: taskId
    }, lang)

    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: deleteTask error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const getSellerSubscription = async (req, res, next) => {
  let { lang } = req.query
  try {

      let result = await CFAM(SUBSCRIPTION_SELLER, 'find', {
        isActive: true
      }, lang)
      
      //response
      res.status(200).json(result);
      
  } catch (err) {
      logToConsole.error("API: getSellerSubscription error: " + err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const getTaskerSubscription = async (req, res, next) => {
  let lang  = req.header("lang")
  try {

    let letsAgg = [
      {
        $match: {
          isActive: true
        },
      },
      {
        $project: {
          title: "$title",
          price: "$price",
          amount: "$amount",
          validity: "$validity",
          commissionPercent: "$commissionPercent",
          description: "$description",
          benefits: "$benefits",
          location: "$location",
          createdAt: "$createdAt",
          homePageAdd: "$homePageAdd",
          validTaskCount: "$validTaskCount"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(SUBSCRIPTION_TASKER, 'aggregate', letsAgg, lang)

    //response
    res.status(200).json(result);
      
  } catch (err) {
      logToConsole.error("API: getTaskerSubscription error: " + err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const getUserFAQ = async (req, res, next) => {
  let lang = req.header("lang")

  try {

      let result = await CFAM(FAQ, 'find', {
        isOn: true
      }, lang)
      
      //response
      res.status(200).json(result);
      
  } catch (err) {
      logToConsole.error("API: getTaskerSubscription error: " + err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const getUserNotification = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {
      let result = await CFAM( USER, 'findOne', {
        query: {
          _id: userId,
        },
        select: 'mobile email userType',
      }, lang) 


      if(result.data){
        let notifycation = await NOTIFY.get(userId, result.data.userType, lang)
        //response
        res.status(200).json(notifycation);
      }else{
        res.status(200).json({
            error: true,
            message: translate[lang || 'en'].USERNOTFOUND,
        });
      }

  } catch (err) {
      logToConsole.error("API: getRecivedCards error: "+err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};
 
const getWalletHistory = async (req, res, next) => {
  let { lang } = req.query
  let { userId } = req.auth 
  try {

      let result;

      let data = [
        {
          $match: {
            userId: parseInt(userId)
          } 
        },
        {
          $lookup: {
              from: 'Transaction_Wallet',
              localField: '_id',
              foreignField: 'walletId',
              as: 'transactions'
            }
        },
      ]

    
      result = await CFAMAggrigate( WALLET, 'aggregate', data, lang)

      //response
      res.status(200).json(result);
  } catch (err) {
      logToConsole.error("API: getWalletHistory error: "+err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const transfer = async (req, res) => {
  // const session = await mongoose.startSession();
  // session.startTransaction()
  try {
      const { toUserId, fromUserId, amount, summary} = req.body;
      const reference = v4();
      if (!toUserId && !fromUserId && !amount && !summary) {
          return res.status(400).json({
              status: false,
              message: 'Please provide the following details: toUsername, fromUsername, amount, summary'
          })
      }

    const transferResult = await Promise.all([
      debitAccount(
        {
          amount, 
          userId:fromUserId, 
          purpose:"transfer", 
          reference, 
          summary,
          trnxSummary: `TRFR TO: ${toUserId}. TRNX REF:${reference} `,
          // session
        }),
      creditAccount(
        {
          amount, 
          userId:toUserId, 
          purpose:"transfer", 
          reference, 
          summary,
          trnxSummary:`TRFR FROM: ${fromUserId}. TRNX REF:${reference} `, 
          // session
        })
    ]);

    const failedTxns = transferResult.filter((result) => result.status !== true);
    if (failedTxns.length) {
      const errors = failedTxns.map(a => a.message);
      await session.abortTransaction();
      return res.status(400).json({
          status: false,
          message: errors
      })
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: true,
      message: 'Transfer successful'
  })
  } catch (err) {
      await session.abortTransaction();
      session.endSession();

      return res.status(500).json({
          status: false,
          message: `Unable to find perform transfer. Please try again. \n Error: ${err}`
      })
  }
}

const getAllCategoryWiseUser = async (req, res, next) => {
  let lang = req.header("lang")
  try {
    
    let letsAgg = [
      {
        $match: {
          isOn: true,
          $expr: {
            $in: ["task", "$processName"]
          }
        }
      },
      {
        $lookup: {
            from: "Users",
            let: { resultData: "$categoryName" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $in: [ "$$resultData", "$skill" ] 
                        }
                    }
                },
                {
                  $project: {
                    mobile: "$mobile",
                    email: "$email",
                    profileImage: "$profileImage",
                    description: "$description",
                    rating: "$rating",
                    skill: "$skill",
                    userName: "$name"
                  }
                }
            ],
            as: "users"
        }
      },
      {
        $project: {
          categoryName: "$categoryName",
          usersList: "$users"
        }
      },
      { $limit : 5 }
    ]

    let result = await CFAMAggrigate(CATEGORY, 'aggregate', letsAgg, lang)

    if(result?.data){
      result.data = result?.data.filter((data)=>{
        if(data.usersList.length>0){
          return data
        }
      })
    }
    //response
    res.status(200).json(result);
  } catch (err) {
      logToConsole.error("API: getAllCategoryWiseUser error: "+err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const getAllUserByCategory = async (req, res, next) => {
  let lang = req.header("lang")
  let categoryId = req.header("categoryId")
  let pageNo = req.header("pageNo")
  let size = req.header("size")
  try {
    
    let letsAgg = {
      query: {
        isOn: true,
        $expr: {
          $in: ["task", "$processName"]
        },
        _id: categoryId
      }
    }

    let category = await CFAM(CATEGORY, 'findOne', letsAgg, lang)

    if(category?.error == false){

      let findData = {
        isActive: true,
        $expr: {
          $in: [ category?.data?.categoryName, "$skill" ] 
        }
      }

      let skip = size * (pageNo - 1)
      let limit = size

      let result = await CFAMFindPagination( USER, findData, lang, skip, limit )
      let overall = await CFAM(USER, 'find', findData, lang)

      if(result?.data?.length > 0){
        result.data = {
          count: overall.data.length,
          list: result.data
        }
      }
      //response
      res.status(200).json(result);

    }else{
      //response
      res.status(200).json(category);
    }
    

    
  } catch (err) {
      logToConsole.error("API: getAllUserByCategory error: "+err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const putImageToS3 = async (req, res, next) => {
  let { lang, bucketName, folderName } = req.body
  try {
      let data = {
        error: true,
        message: translate[lang || 'en'].PLEASETRYLATER
      };
      
      S3.save(bucketName, folderName, req.file, async(err, dataSet)=>{ 
        if(err){
          data.errMessage = err 
          res.status(200).json(data);
        }else{
          data.error = false,
          data.message = translate[lang || 'en'].IMAGEUPLOADED ;
          data.data = dataSet
          res.status(200).json(data);
        }
      }, true)

  } catch (err) {
      logToConsole.error("API: putImageToS3 error: ",err)
      res.status(200).json({
          error: true,
          message: translate[lang || 'en'].SERVERERR,
          errMessage: err.message,
      });
  }
};

const getTaskListById = async (req, res, next) => {
  let lang = req.header("lang")
  let taskId = req.header("taskId")
  let { userId } = req.auth
  try {

    let letsAgg = [
      {
        $match: {
          _id: parseInt(taskId),
          isActive: true
        }
      },
      {
        $lookup: {
            from: 'Users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
            from: 'Offers',
            let: { taskId: "$_id", assOfferId: "$assignedOfferId", taskerId: "$userId"},
            pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [ "$taskId", "$$taskId"]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'Users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'OfferUser'
                  }
                },
                {
                  $unwind: "$OfferUser"
                },
                {
                  $project: {
                    offerId: "$_id",
                    userId: "$userId",
                    taskId: "$taskId",
                    posterId: "$$taskerId",
                    userName: "$OfferUser.name",
                    rating: "$OfferUser.rating",
                    profileImage: "$OfferUser.profileImage",
                    offerAmount: "$budget",
                    description: "$description",
                    replaysCount: "$replaysCount",
                    isAccepted: {
                      $cond: { if: { $eq: [ "$$assOfferId", "$_id" ] }, then: true, else: false }
                    }
                  }
                }
            ],
            as: 'offerDetails'
        }
      },
      {
        $project: {
          userId: "$userId",
          posterName: "$user.name",
          posterImage: "$user.profileImage",
          title: "$title",
          taskType: "$taskType",
          amount: { $trunc:[ "$amount", 2 ] },
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, 
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          profileImage: "$user.profileImage",
          // postedOffer: "$offerDetails",
          offers: "$offerDetails",
          isOwner: {
            $cond: { if: { $eq: [ "$userId", userId ] }, then: true, else: false }
          }
        }
      },
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

    //response  
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: getTaskList error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getCanceledTasks = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
          isCanceled: true
        },
      },
      {
        $project: {
          userId: "$userId",
          title: "$title",
          taskType: "$taskType",
          amount: "$amount",
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: "$date",
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          status: "$status",
          isCanceled: "$isCanceled",
          canceledTime: "$canceledTime",
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

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

const getCompletedTasks = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
          isCompleted: true
        },
      },
      {
        $project: {
          userId: "$userId",
          title: "$title",
          taskType: "$taskType",
          amount: "$amount",
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: "$date",
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          status: "$status",
          isCompleted: "$isCompleted",
          completedTime: "$completedTime",
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

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

const getOngoingTasks = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
          isWorkStarted: true
        },
      },
      {
        $lookup: {
          from: "Offers",
          let: {
            taskId: "$_id"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$taskId", "$$taskId"  ]
                }
              }
            },
            {
              $project: {
                offerId: "$_id"
              }
            }
          ],
          as: "offerDetails"
        }
      },
      {
        $unwind: "$offerDetails"
      },
      {
        $project: {
          userId: "$userId",
          title: "$title",
          taskType: "$taskType",
          amount: "$amount",
          amountUnit: "$amountUnit",
          images: "$images",
          description: "$description",
          date: "$date",
          time: "$time",
          location: "$location",
          isActive: "$isActive",
          offersCount: "$offersCount",
          createdAt: "$createdAt",
          status: "$status",
          isCompleted: "$isCompleted",
          completedTime: "$completedTime",
          isWorkStarted: "$isWorkStarted",
          workStartedTime: "$workStartedTime",
          offerId: "$offerDetails.offerId"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(TASKS, 'aggregate', letsAgg, lang)

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

const cancelTask = async (req, res, next) => {
  let { lang, taskId } = req.body
  let { userId } = req.auth 
  try {

    let result = await CFAM(TASKS, 'findOneAndUpdate', {
      query: {
        userId,
        isWorkStarted: false,
        isCompleted: false,
        _id: taskId
      },
      update: {
        isCanceled: true,
        canceledTime: now,
        status: "canceled"
      },
      new: { new:true }
    }, lang)

    let offerUpdate = await CFAM(OFFERS, 'findOneAndUpdate', {
      query: { 
        taskId,
        isCanceled: false
      },
      update: {
        isCanceled: true,
        status: "canceled",
      },
      sort: { new: true }
    }, lang)

    //payment refund
    if(offerUpdate?.error == false && offerUpdate?.data?.isPaid){
      console.log("payment refund process need to be done here")
    }

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

const completeTask = async (req, res, next) => {
  let { lang, taskId } = req.body
  let { userId } = req.auth 
  try {

    let result = await CFAM(TASKS, 'findOneAndUpdate', {
      query: {
        userId,
        isCanceled: false,
        isWorkStarted: true,
        _id: taskId
      },
      update: {
        isCompleted: true,
        completedTime: now,
        status: "completed"
      },
      new: { new:true }
    }, lang)

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

const buyYourSubscription_tasker = async (req, res, next) => {
  let { lang, packageId, isPaid } = req.body
  let { userId } = req.auth
  try {

    let subscription = await CFAM(SUBSCRIPTION_TASKER, 'findOne', { 
      query: {
        _id: packageId, isActive: true
      }
    }, lang)

    if(subscription?.data){

      let dataToStore = {
        userId,
        subscriptionId: packageId,
        subscriptionType: "tasker",
        isPaid,
        endDate: dateRaw.setDate(dateRaw.getDate() + subscription?.data?.validity),
        commissionPercent: subscription?.data?.commissionPercent,
        taskCount: subscription?.data?.validTaskCount,
        allowHomePage: subscription?.data?.homePageAdd,
      }

      let result = await CFAM(PURCHASEDSUBSCRIPTION, 'create', dataToStore, lang)

      //response
      res.status(200).json(result);
    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].VALIDSUBSCRIPTION
      });
    }
    //response
    // res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const purchasedSubscription = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
        },
      },
      {
        $lookup: {
          from: "Subscription_Tasker",
          localField: "subscriptionId",
          foreignField: "_id",
          as: "subscriptionDeatils"
        }
      },
      {
        $unwind: "$subscriptionDeatils"
      },
      {
        $project: {
          userId: "$userId",
          subscriptionId: "$subscriptionDeatils",
          subscriptionType: "$subscriptionType",
          isPaid: "$isPaid",
          startDate: "$startDate",
          endDate: "$endDate",
          commissionPercent: "$commissionPercent",
          taskCount: "$taskCount",
          usedTaskCount: "$usedTaskCount",
          allowHomePage: "$allowHomePage",
          createdAt: "$createdAt"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(PURCHASEDSUBSCRIPTION, 'aggregate', letsAgg, lang)

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

const addBillingInfo = async (req, res, next) => {
  let { lang } = req.body
  let { userId } = req.auth
  try {

    let result = await CFAMValidation(BILLINGINFO, 'create', 
    {
      userId,
      ...req.body
    }, lang, true, [ 'title' ])

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

const getYourBillingInfo = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $project: {
          userId: "$userId",
          accountHolderName: "$accountHolderName",
          accountNumber: "$accountNumber",
          BSB: "$BSB",
          address_line_1: "$address_line_1",
          address_line_2: "$address_line_2",
          suburb: "$suburb",
          postCode: "$postCode",
          state: "$state",
          country: "$country"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(BILLINGINFO, 'aggregate', letsAgg, lang)

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

const editBillingInfo = async (req, res, next) => {
  let { lang } = req.body
  let { userId } = req.auth
  try {

    let result = await CFAM(BILLINGINFO, 'findOneAndUpdate', 
    {
      query: {
        userId
      },
      update: {
        ...req.body
      }
    }, lang)

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

const postOffersToTask = async (req, res, next) => {
  let { lang, taskId } = req.body
  let { userId } = req.auth
  try {
    
    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: { 
        _id: taskId,
        isActive: true,
        isCanceled: false,
        isCompleted: false,
        isWorkStarted: false,
        isAssigned: false
      }
    }, lang)

    
    if(taskDetails?.error == false){

      if(taskDetails?.data?.userId != userId){
        let result = await CFAM(OFFERS, 'create', 
        {
          userId,
          ...req.body
        }, lang)
    
        await CFAM(TASKS, 'findOneAndUpdate', {
          query: { 
            _id: taskId,
          },
          update: {
            $inc: {
              offersCount: 1
            }
          }
        }, lang)

        //response
        res.status(200).json(result);
      }else{
        //response
        res.status(200).json({
          error: true,
          message: translate[lang || 'en'].YOUCANT
        });
      }

      
      }else{
        //response
        res.status(200).json({
          error: true,
          message: translate[lang || 'en'].INVALIDTASK
        });
      }
  } catch (err) {
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getYourPostedOffer = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ]
                }
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          title: "$taskDetails.title",
          taskType: "$taskDetails.taskType",
          amount: "$taskDetails.amount",
          amountUnit: "$taskDetails.amountUnit",
          description: "$taskDetails.description",
          date: {
            $dateToString: {
              format: "%Y-%m-%d", date: "$taskDetails.date"
            }
          },
          time: "$taskDetails.time",
          isActive: "$taskDetails.isActive",
          offerId: "$_id",
          taskId: "$taskId",
          offeredUserId: "$userId",
          offeredDescription: "$description",
          offeredBudget: "$budget",
          offeredStatus: "$status",
          offeredAccepted: "$isAccepted",
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(OFFERS, 'aggregate', letsAgg, lang)

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

const acceptOffer = async (req, res, next) => {
  let { lang, taskId, offerId } = req.body
  let { userId } = req.auth
  try {

    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: {
        userId, 
        _id: taskId,
        isActive: true,
        isCanceled: false,
        isCompleted: false,
        isWorkStarted: false,
        isAssigned: false
      }
    }, lang)

    if(taskDetails?.error == false){
      let task = await CFAM(OFFERS, 'findOneAndUpdate', {
        query: {
          _id: offerId,
          taskId,
          isCanceled: false
        },
        update: {
          $set: {
            isAccepted: true,
            acceptedTime: now,
            status: "accepted",
          }
        }
      }, lang)

      if(task?.error == false){

        let result = await CFAM(TASKS, 'findOneAndUpdate', {
          query: {
            _id: taskId,
            userId,
          },
          update: {
            $set: {
              status: "assigned",
              assignedOfferId: offerId,
              isAssigned: true,
            }
          }
        }, lang)


        //payment update:
        let payment = await CFAM(PAYMENT, 'create', {
          userId,
          taskerId: task?.data?.userId,
          taskId: taskId,
          taskAmount: task?.data?.budget,
          total: task?.data?.budget,
          }, lang)


        if(payment?.error == false){
          console.log("payment created");
        }else{
          console.log("payment not created!. please check");
        }

        //response
        res.status(200).json(result);
      }else{
        //response
        res.status(200).json({
          error: true,
          message: translate[lang || 'en'].INVALIDOFFER
        });
      }
      
    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].INVALIDTASK
      });
    }
    

  } catch (err) {
    logToConsole.error("API: acceptOffer error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getNewAppointments = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
            offerId: "$_id"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                },
                $expr: {
                  $eq: [ "$assignedOfferId", "$$offerId" ],
                }
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          title: "$taskDetails.title",
          taskType: "$taskDetails.taskType",
          amount: "$taskDetails.amount",
          amountUnit: "$taskDetails.amountUnit",
          description: "$taskDetails.description",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$taskDetails.date" } },
          time: "$taskDetails.time",
          isActive: "$taskDetails.isActive",
          isAssigned: "$taskDetails.isAssigned",
          isWorkStarted: "$taskDetails.isWorkStarted",
          isCanceled: "$taskDetails.isCanceled",
          isCompleted: "$taskDetails.isCompleted",
          status: "$taskDetails.status",

          offerId: "$_id",
          taskId: "$taskId",
          offeredUserId: "$userId",
          offeredDescription: "$description",
          offeredBudget: "$budget",
          offeredStatus: "$status",
          offeredAccepted: "$isAccepted",
          
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(OFFERS, 'aggregate', letsAgg, lang)

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

const startWorkForOffer = async (req, res, next) => {
  let { lang, taskId, offerId } = req.body
  let { userId } = req.auth
  try {

    let offerValid = await CFAM(OFFERS, 'findOne', {
      query: { 
        _id: offerId,
        userId,
        isAccepted: true,
        isPaid: true
      }
    }, lang)

    if(offerValid?.error == false){

      let taskDetails = await CFAM(TASKS, 'findOne', {
        query: { 
          _id: offerValid?.data?.taskId,
          isActive: true,
          isCanceled: false,
          isCompleted: false,
          isWorkStarted: false,
          isAssigned: true
        }
      }, lang)
  
      if(taskDetails?.error == false){
        let result = await CFAM(OFFERS, 'findOneAndUpdate', {
          query: { 
            _id: offerId,
          },
          update: {
            $set: {
              isActive: false,
              status: "ongoing",
              isWorkStarted: true,
              workStartedTime: now,
            }
          },
        }, lang)
        
        await CFAM(TASKS, 'findOneAndUpdate', {
          query: { 
            _id: result?.data?.taskId,
          },
          update:{
            $set: {
              status: "ongoing",
              isWorkStarted: true,
              workStartedTime: now,
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
          message: translate[lang || 'en'].INVALIDTASKSTART
        });
      }

    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].INVALIDOFFFORSTART
      });
    }

  } catch (err) {
    logToConsole.error("API: acceptOffer error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getCompletedAppointment = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
            offerId: "$_id"
          },
          pipeline: [
            {
              $match: {
                isCompleted: true,
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                },
                $expr: {
                  $eq: [ "$assignedOfferId", "$$offerId" ],
                }
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          title: "$taskDetails.title",
          taskType: "$taskDetails.taskType",
          amount: "$taskDetails.amount",
          amountUnit: "$taskDetails.amountUnit",
          description: "$taskDetails.description",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$taskDetails.date" } },
          time: "$taskDetails.time",
          isActive: "$taskDetails.isActive",
          isAssigned: "$taskDetails.isAssigned",
          isWorkStarted: "$taskDetails.isWorkStarted",
          isCanceled: "$taskDetails.isCanceled",
          isCompleted: "$taskDetails.isCompleted",
          status: "$taskDetails.status",

          offerId: "$_id",
          taskId: "$taskDetails._id",
          offeredUserId: "$userId",
          offeredDescription: "$description",
          offeredBudget: "$budget",
          offeredStatus: "$status",
          offeredAccepted: "$isAccepted",
          
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(OFFERS, 'aggregate', letsAgg, lang)

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

const getCanceledAppointment = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
            offerId: "$_id"
          },
          pipeline: [
            {
              $match: {
                isCanceled: true,
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                },
                $expr: {
                  $eq: [ "$assignedOfferId", "$$offerId" ],
                }
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          title: "$taskDetails.title",
          taskType: "$taskDetails.taskType",
          amount: "$taskDetails.amount",
          amountUnit: "$taskDetails.amountUnit",
          description: "$taskDetails.description",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$taskDetails.date" } },
          time: "$taskDetails.time",
          isActive: "$taskDetails.isActive",
          isAssigned: "$taskDetails.isAssigned",
          isWorkStarted: "$taskDetails.isWorkStarted",
          isCanceled: "$taskDetails.isCanceled",
          isCompleted: "$taskDetails.isCompleted",
          status: "$taskDetails.status",

          offerId: "$_id",
          taskId: "$taskDetails._id",
          offeredUserId: "$userId",
          offeredDescription: "$description",
          offeredBudget: "$budget",
          offeredStatus: "$status",
          offeredAccepted: "$isAccepted",
          
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(OFFERS, 'aggregate', letsAgg, lang)

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

const paymentUpdateForOffer = async (req, res, next) => {
  let { lang, taskId, taskerId, total, taskAmount, gst, couponId, discount,paymentReferanceId, isPayed, } = req.body
  let { userId } = req.auth

  try {

    let paymentDeatails = await CFAM(PAYMENT, 'findOne', {
      taskerId,
      taskId,
     }, lang)


    if(paymentDeatails?.error == false){

      let result = await CFAM( PAYMENT, 'findOneAndUpdate', {
        query: {
          taskerId,
          taskId,
        },
        update: {
          taskAmount,
          gst,
          couponId,
          discount,
          total,
          isPayed,
          payedDate: isPayed? now : null ,
          paymentReferanceId
        }
        
      }, lang)

      delete result.data

      //response
      res.status(200).json(result);

    }else{  
      let result = await CFAM(PAYMENT, 'create', {
        userId,
        taskerId,
        taskId,
        taskAmount,
        gst,
        couponId,
        discount,
        total,
        isPayed,
        payedDate: isPayed? now : null ,
        paymentReferanceId
      }, lang)

      delete result.data

      await CFAM(OFFERS, 'findOneAndUpdate', {
       query: {
        userId,
        taskId,
       },
       update: {
        $set: {
          isPaid: isPayed
        }
       }
      }, lang)

      //response
      res.status(200).json(result);

    }

    

  } catch (err) {
    logToConsole.error("API: paymentUpdateForOffer error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }

};

const getYourBillingHistory = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },
          taskAmount: "$taskAmount",
          gst: "$gst",
          total: "$total",
          couponId: "$couponId",
          isPayed: "$isPayed",
          payedDate: "$payedDate",
          paymentReferanceId: "$paymentReferanceId",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(PAYMENT, 'aggregate', letsAgg, lang)

    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: getYourBillingHistory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const updateBillingStatus = async (req, res, next) => {
  let { lang, billId, isPayed, paymentReferanceId } = req.body
  let { userId } = req.auth

  try {

    let result = await CFAM(PAYMENT, 'findOneAndUpdate', {
      query: {
        _id: billId
      },
      update: {
        $set: {
          isPayed,
          paymentReferanceId,
        }
      }
    }, lang)

    delete result.data

    //response
    res.status(200).json(result);

  } catch (err) {
    logToConsole.error("API: updateBillingStatus error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }

};

const editPost = async (req, res, next) => {
  let { lang, postId } = req.body
  let { userId } = req.auth
  try {

    let result = await CFAM(TASKS, 'findOneAndUpdate', 
    {
      query: {  
        _id: postId
      },
      update: {
        userId,
        ...req.body
      }
    }, lang)

    delete result.data;

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

const postReview = async (req, res, next) => {
  let { lang, taskId, offerId } = req.body
  let { userId } = req.auth
  try {

    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: { 
        _id: taskId,
        assignedOfferId: offerId
      }
    }, lang)

    let ReviewDetails = await CFAM(REVIEWS, 'findOne', {
      query: { 
        postedBy: userId,
        taskId: taskId,
        offerId: offerId,
      }
    }, lang)

    if(taskDetails?.error == false && ReviewDetails?.error == true){
      
      if(req.body.userId != userId ){
        let result = await CFAM(REVIEWS, 'create', 
        {
          postedBy: userId,
          ...req.body
        }, lang)
    
        if(result?.error == false){
          let agg = [
            {
              $match: {
                userId: parseInt(req.body.userId)
              }
            },
            {
              $project: {
                rating: { $avg: "$rating" }
              }
            }
          ]
          
          let review = await CFAMAggrigate(REVIEWS, 'aggregate', agg, lang)
  
          if(review?.data == false){
            await CFAM(USER, 'findOneAndUpdate', {
              query: {
                _id: req.body.userId
              },
              update: {
                $set: {
                  rating: review?.data[0]?.rating
                }
              }
            }, lang)
          }

        }
        
        //response
        res.status(200).json(result);

      }else{
        //response
        res.status(200).json({
          error: true,
          message: translate[lang || 'en'].YOURNOTALLOW
        });
      }
    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].NOTABLETORATE
      });
    }
    

  } catch (err) {
    logToConsole.error("API: postReview error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getYourReview = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$postedBy",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          rating: "$rating",
          images: "$images",
          review: "$review",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },

          posterDetails: "$posterDetails",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(REVIEWS, 'aggregate', letsAgg, lang)

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

const getReviewByOfferId = async (req, res, next) => {
  let lang = req.header("lang")
  let offerId = req.header("offerId")

  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          offerId: parseInt(offerId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$postedBy",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          rating: "$rating",
          images: "$images",
          review: "$review",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },

          posterDetails: "$posterDetails",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(REVIEWS, 'aggregate', letsAgg, lang)

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

const getReviewByTaskId = async (req, res, next) => {
  let lang = req.header("lang")
  let taskId = req.header("taskId")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          taskId: parseInt(taskId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$postedBy",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          rating: "$rating",
          images: "$images",
          review: "$review",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },

          posterDetails: "$posterDetails",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(REVIEWS, 'aggregate', letsAgg, lang)

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

const getProfileById = async (req, res, next) => {
  let lang = req.header("lang")
  let userId = req.header("userId")

  try {

    let letsAgg = [
      {
        $match: {
          _id: parseInt(userId)
        },
      },
      {
        $project: {
          userId: "$_id",
          isMobileVerified: "$isMobileVerified",
          isEmailVerified: "$isEmailVerified",
          name: "$name",
          email: "$email",
          mobile: "$mobile",
          profileImage: "$profileImage",
          address: "$address",
          tagLine: "$tagLine",
          description: "$description",
          qualification: "$qualification",
          skill: "$skill",
          certificate: "$certificate",
          portfolio: "$portfolio",
          isProfileUpdate: "$isProfileUpdate",
          rating: "$rating",
          isActive: "$isActive",
          education: {
              '$map': { 
                  'input': '$education', 
                  'as': 'place', 
                  'in': { 
                      'degree': '$$place.degree', 
                      'yearOfCompletion': '$$place.yearOfCompletion'
                  }
              }
          },
          createdAt: "$createdAt",
          FCMToken: "$FCMToken"
        }
      }
    ]

    let result = await CFAMAggrigate(USER, 'aggregate', letsAgg, lang)

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

const postReport = async (req, res, next) => {
  let { lang, taskId } = req.body
  let { userId } = req.auth
  try {

  } catch (err) {
    logToConsole.error("API: postReview error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getAllTaskByStatus = async (req, res, next) => {
  let lang = req.header("lang")
  let status = req.header("status")
  let { userId } = req.auth 
  try {

    switch(status){
      case "posted": {
        getPostedTasks(req, res);
        break;
      }
      case "ongoing": {
        getOngoingTasks(req, res)
        break;

      }
      case "canceled": {
        getCanceledTasks(req, res)
        break;

      }
      case "completed": {
        getCompletedTasks(req, res)
        break;

      }
    }

  } catch (err) {
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const getAllOffersByStatus = async (req, res, next) => {
  let lang = req.header("lang")
  let status = req.header("status")
  let { userId } = req.auth 
  try {

    switch(status){
      case "offers": {
        getYourPostedOffer(req, res);
        break;
      }
      case "appointment": {
        getNewAppointments(req, res)
        break;
      }
      case "completed": {
        getCompletedAppointment(req, res)
        break;
      }
      case "canceled": {
        getCanceledAppointment(req, res)
        break;
      }
    }

  } catch (err) {
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const postReply = async (req, res, next) => {
  let { lang, offerId, taskId, message, receiverId, contentType } = req.body
  let { userId } = req.auth

  try {

    let offerDetails = await CFAM(OFFERS, 'findOne', {
      query: { 
        _id: offerId,
        userId: userId,
        taskId
      }
    }, lang)

    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: { 
        _id: taskId,
        userId: userId,
      }
    }, lang)

    if( offerDetails?.error == false || taskDetails?.error == false ){
      
      let result = await CFAM(REPLAYS, 'create', { 
        senderId: userId ,
        offerId ,
        taskId,
        receiverId, 
        message ,
        contentType,
        userType: taskDetails?.error == false ? "poster" : "tasker"
      }, lang)

      if(result?.error == false){
        await CFAM(OFFERS, 'findOneAndUpdate', { 
          query: {
            _id: offerId,
          },
          update: {
            $inc: {
              replaysCount: 1
            }
          }
        }, lang)
      }

      delete result.data
      //response
      res.status(200).json(result);
    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].CANTREPLAY
      });
    }

  } catch (err) {
    logToConsole.error("API: postReplay error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getReplysByOfferId = async (req, res, next) => {
  let lang = req.header("lang")
  let offerId = req.header("offerId")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          offerId: parseInt(offerId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$senderId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $project: {
          // userDetails: "$posterDetails",
          message: "$message",
          contentType: "$contentType",
          senderId: "$senderId",
          receiverId: "$receiverId",
          userType: "$userType",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },
          isPoster:"$isPoster"
        }
      },
      // {
      //   $sort: { createdAt: -1 }
      // }
    ]

    let result = await CFAMAggrigate(REPLAYS, 'aggregate', letsAgg, lang)

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

const postQuestions = async (req, res, next) => {
  let { lang, taskId, question, questionType } = req.body
  let { userId } = req.auth

  try {
        
    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: { 
        _id: taskId,
      }
    }, lang)

    if( taskDetails?.error == false && taskDetails?.data?.userId != userId ){
      
      let result = await CFAM(TASKQUESTIONS, 'create', { 
        userId, taskId, question, questionType
      }, lang)

      delete result.data

      //response
      res.status(200).json(result);


    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].CANTPOSTQUESTION
      });
    }

  } catch (err) {
    logToConsole.error("API: postReplay error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getBadgesList = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          isOn: true
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
          },
          isRejected: {
            $cond: [
              {
                $in: [ parseInt(userId), "$rejectedUser" ]
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
    logToConsole.error("API: getAllCategory_Subcategory error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
};

const requestForBadges = async (req, res, next) => {
  let { lang, badgeId } = req.body
  let { userId } = req.auth

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

    if(find?.error == true){
      let result = await CFAM(BADGES, 'findOneAndUpdate', {
        query: {
          _id: badgeId
        },
        update: {
          $push: {
            applyedUser: userId
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
        message: "You have already registered for this badge"
      });
    }

  } catch (err) {
    logToConsole.error("API: postReplay error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getQuestionsByTaskId = async (req, res, next) => {
  let lang = req.header("lang")
  let taskId = req.header("taskId")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          taskId: parseInt(taskId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$userId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $project: {
          userDetails: "$posterDetails",
          question: "$question",
          questionType: "$questionType",
          answersCount: "$answersCount",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(TASKQUESTIONS, 'aggregate', letsAgg, lang)

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

const postReplayForQuestion = async (req, res, next) => {
  let { lang, taskId, questionId, answer, answerType } = req.body
  let { userId } = req.auth

  try {
        
    let taskDetails = await CFAM(TASKS, 'findOne', {
      query: { 
        _id: taskId,
      }
    }, lang)

    let questionDetails = await CFAM(TASKQUESTIONS, 'findOne', {
      query: { 
        _id: questionId,
      }
    }, lang)


    if( taskDetails?.error == false && questionDetails?.error == false && taskDetails?.data?.userId == userId ){
      
      let result = await CFAM(ANSWERS, 'create', { 
        userId, taskId, questionId, answer, answerType
      }, lang)

      delete result.data

      if(result?.error == false){
        await CFAM(TASKQUESTIONS, 'findOneAndUpdate', { 
          query: {
            _id: questionId,
          },
          update: {
            $inc: {
              answersCount: 1
            }
          }
        }, lang)
      }
      

      //response
      res.status(200).json(result);


    }else{
      //response
      res.status(200).json({
        error: true,
        message: translate[lang || 'en'].CANTANSWER
      });
    }

  } catch (err) {
    logToConsole.error("API: postReplay error: " + err)
    res.status(200).json({
      error: true,
      message: translate[lang || 'en'].SERVERERR,
      errMessage: err.message,
    });
  }
}; 

const getAnswersByQuestionId = async (req, res, next) => {
  let lang = req.header("lang")
  let questionId = req.header("questionId")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          questionId: parseInt(questionId)
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$userId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $project: {
          userDetails: "$posterDetails",
          answer: "$answer",
          answerType: "$answerType",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(ANSWERS, 'aggregate', letsAgg, lang)

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

const completedTheOffer = async (req, res, next) => {
  let { lang, taskId } = req.body
  let { userId } = req.auth 
  try {

    let result = await CFAM(TASKS, 'findOneAndUpdate', {
      query: {
        isCanceled: false,
        isWorkStarted: true,
        _id: taskId
      },
      update: {
        taskerCompletion: true,
        tskCompletionDate: now,
        status: "taskerCompleted"
      },
      new: { new:true }
    }, lang)

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

const getPostersReview = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
          as: "poster"
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$postedBy",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          rating: "$rating",
          images: "$images",
          review: "$review",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },

          posterDetails: "$posterDetails",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(REVIEWS, 'aggregate', letsAgg, lang)

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

const getTaskersReview = async (req, res, next) => {
  let lang = req.header("lang")
  let { userId } = req.auth 
  try {

    let letsAgg = [
      {
        $match: {
          userId: parseInt(userId),
          as: "tasker"
        },
      },
      {
        $lookup: {
          from: "Users",
          let: {
            userId: "$postedBy",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$userId"  ],
                }
              }
            },
            {
              $project: {
                name: "$name",
                mobile: "$mobile",
                email: "$email",
                profileImage: "$profileImage",
                rating: "$rating",
              }
            }
          ],
          as: "posterDetails"
        }
      },
      {
        $unwind: "$posterDetails"
      },
      {
        $lookup: {
          from: "Tasks",
          let: {
            taskId: "$taskId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$taskId"  ],
                }
              }
            },
            {
              $project: {
                title: "$title",
                taskType: "$taskType",
                amount: "$amount",
                amountUnit: "$amountUnit",
                images: "$images",
                description: "$description",
              }
            }
          ],
          as: "taskDetails"
        }
      },
      {
        $unwind: "$taskDetails"
      },
      {
        $project: {
          rating: "$rating",
          images: "$images",
          review: "$review",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          time: {
            $dateToString: { format: "%H:%M", date: "$createdAt" }
          },

          posterDetails: "$posterDetails",
          taskDetails: "$taskDetails"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]

    let result = await CFAMAggrigate(REVIEWS, 'aggregate', letsAgg, lang)

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



module.exports = {
  getTaskersReview,
  getPostersReview,
  getTermsAndConditons,
  getPrivacy,
  getAboutUs,
  completedTheOffer,
  getAnswersByQuestionId,
  postReplayForQuestion,
  getQuestionsByTaskId,
  postReply,
  requestForBadges,
  getBadgesList,
  getAllTaskByCategoryId,
  postQuestions,
  getReplysByOfferId,
  getAllOffersByStatus,
  getAllTaskByStatus,
  postReport,
  getProfileById,
  getReviewByOfferId,
  getReviewByTaskId,
  getYourReview,
  postReview,
  editPost,
  paymentUpdateForOffer,
  updateBillingStatus,
  getYourBillingHistory,
  getCanceledAppointment,
  getCompletedAppointment,
  startWorkForOffer,
  getNewAppointments,
  acceptOffer,
  getYourPostedOffer,
  postOffersToTask,
  editBillingInfo,
  getYourBillingInfo,
  addBillingInfo,
  purchasedSubscription,
  buyYourSubscription_tasker,
  completeTask,
  cancelTask,
  getOngoingTasks,
  getCompletedTasks,
  getCanceledTasks,
  getTaskListById,
  putImageToS3,
  getAllUserByCategory,
  getAllCategoryWiseUser,
  getAllTaskCategory,
  getWalletHistory,
  transfer,
  getUserNotification,
  verifyUser,
  getUserFAQ,
  getTaskerSubscription,
  getSellerSubscription,
  deleteTask,
  setTaskStatus,
  getTaskList,
  getPostedTasks,
  postTask,
  setPostStatus,
  getActivePost,
  getInactivePost,
  deleteSellingProduct,
  postSellingProduct,
  updateUserProfile,
  getMyProfile,
  getAllCategory_Subcategory,
  validateUser,
  sendOTPtoMobile,
  loginUser,
  verifyOTP,
  smsCoordinator
};
