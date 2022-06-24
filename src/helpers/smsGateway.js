const { default: axios } = require("axios");
const configs = require("../configs");

const URL = {
    message : 'https://api.taqnyat.sa/v1/messages',
    balance : 'https://api.taqnyat.sa/v1/messages',
    deleteSchedule: 'https://api.taqnyat.sa/v1/messages/delete'
}

const send = (recipient, message, sendBack) => {
    axios({
        method: 'get',
        url: URL.message,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        data: {},
        params: {
            bearerTokens: configs.BEARER_TOKENS,
            sender: configs.SENDER,
            recipients: recipient,
            body: message
        }
      })
        .then(function (response) {
            sendBack(response);
        });
}

const balance = (sendBack) => {
    axios({
        method: 'get',
        url: URL.balance,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        data: {},
        params: {
            bearerTokens: configs.BEARER_TOKENS,
        }
      })
        .then(function (response) {
            sendBack(response);
        });
}

const scheduleSend = (recipient, message, time, sendBack) => {
    axios({
        method: 'get',
        url: URL.message,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        data: {},
        params: {
            bearerTokens: configs.BEARER_TOKENS,
            sender: configs.SENDER,
            recipients: recipient,
            body: message,
            scheduledDatetime: time
        }
      })
        .then(function (response) {
            sendBack(response);
        });
}


const deleteScheduleSms = (id, sendBack) => {
    axios({
        method: 'get',
        url: URL.deleteSchedule,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        data: {},
        params: {
            bearerTokens: configs.BEARER_TOKENS,
            deleteId: id,
        }
      })
        .then(function (response) {
            sendBack(response);
        });
}

module.exports = {
    send,
    balance,
    scheduleSend,
    deleteScheduleSms
};