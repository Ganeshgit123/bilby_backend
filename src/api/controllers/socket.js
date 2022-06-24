
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

const getSocketOnline = async (data, callback) =>{

    let result = await CFAM(USER, 'findOneAndUpdate', {
        query: {
            _id: data.id
        },
        update: {
            $set: {
                socketId: data.soketId
            }
        } 
    }, "en" )

    console.log("socketId: "+data.soketId)
    console.log("result: "+result)
    delete result.data

    //response
    callback(result);

}

const chatController = async (data, callback) =>{
    let { senderId, offerId, receiverId, taskId , message , contentType, userType } = data;

    let send = {
        receiverId,
        senderId,
        offerId ,
        taskId,
        message,
        contentType,
        userType,
    }

    let result = await CFAM(REPLAYS, 'create', send, "en")

    
    if(offerId !== undefined){
        await CFAM(OFFERS, 'findOneAndUpdate', { 
            query: {
                _id: offerId,
            },
            update: {
            $inc: {
                    replaysCount: 1
                }
            }
        }, "en")
    }
      
    let letsAgg = [
        {
          $match: {
            _id: parseInt(receiverId)
            },
        },{
            $project: {
                FCMToken: "$FCMToken",
                profileImage: "$profileImage",
                mobile: "$mobile",
                email: "$email",
                name: "$name",
                socketId: "$socketId",
            }
        }
      ]

    let userDetails = await CFAMAggrigate(USER, 'aggregate', letsAgg, "en")

    console.log("userDetails", userDetails)
    
    //response
    callback(result, userDetails);
}

module.exports = {
    chatController,
    getSocketOnline
};
