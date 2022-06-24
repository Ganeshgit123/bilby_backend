const config = require("../../configs/index");
const { CFAM } = require("../dao");
const { NOTIFICATION } = require("../models/admin/questions");

const send = async (data) => {
    return new Promise(async(resolve, reject) => {

        let result = await CFAM( NOTIFICATION, 'create', {...data} , lang, '', '' ) 

        resolve(result)
    });
}

const get = async (userId, userType, lang) => {
    return new Promise(async(resolve, reject) => {
        let query = {
            reciverId: userId,
            reciverType: userType
        }

        let select = 'senderId senderType title message sendDate isViewed viewedDate refKey redirectUrl'
        let result = await CFAM( NOTIFICATION, 'find', query , lang, '', select ) 

        resolve(result)
    });
}

module.exports = {
    send,
    get
}
