const jwt = require("jsonwebtoken");
const config = require("../../configs/index");

module.exports = async (key, value) => {
    let Token = await jwt.sign({
        [key]: value
    }, config.secret, {
        expiresIn: "30 days" // expires in 24 hours
    });

    return Token
}
