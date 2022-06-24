const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

//Schema
const TermsCont = new Schema({
    content: {
        type: String,
        default: ""
    }
},{ 
    timestamps: true            
});

const PrivacyCont = new Schema({
    content: {
        type: String,
        default: ""
    }
},{ 
    timestamps: true            
});

const AboutUsCont = new Schema({
    content: {
        type: String,
        default: ""
    }
},{ 
    timestamps: true            
});

//Auto Increment counter
TermsCont.plugin(autoIncrement.plugin, 'TermsCont');
PrivacyCont.plugin(autoIncrement.plugin, 'PrivacyCont');
AboutUsCont.plugin(autoIncrement.plugin, 'AboutUsCont');


//Declaration
TERMS = mongoose.model("Terms", TermsCont, "Terms");
PRIVACY = mongoose.model("Privacy", PrivacyCont, "Privacy");
ABOUTUS = mongoose.model("About", AboutUsCont, "AboutUs");


module.exports = {
    TERMS,
    PRIVACY,
    ABOUTUS
}