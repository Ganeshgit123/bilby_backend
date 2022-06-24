const mongoose = require('mongoose');
const Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);


//Schema
const postClassified = new Schema({
    userId: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    categoryId: {
        type: Number,
        ref: "category"
    },
    subCategoryId: {
        type:String,
    },
    categoryName: {
        type: String,
        default: ""
    },
    subCategoryName: {
        type: String,
        default: ""
    },
    currancy: {
        type: String,
        default: "$"
    },
    propertyType: {
        type: String,
        default: ""
    },
    image: {
        type: Array,
        default: []
    },
    bedroom: {
        type: String,
        default: ""
    },
    furnishing: {
        type: String,
        default: ""
    },
    petFriendly: {
        type: String,
        default: ""
    },
    constructionStatus: {
        type: String,
        default: ""
    },
    postBy: {
        type: String,
        default: ""
    },
    builtupArea: {
        type: String,
        default: ""
    },
    UDS: {
        type: String,
        default: ""
    },
    monthlyMaintenance: {
        type: String,
        default: ""
    },
    floorNo: {
        type: String,
        default: ""
    },
    projectName: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    rentalType: {
        type: String,
        default: ""
    },
    availability: {
        type: String,
        default: ""
    },
    plotArea: {
        type: String,
        default: ""
    },
    facing: {
        type: String,
        default: ""
    },
    length: {
        type: String,
        default: ""
    },
    breath: {
        type: String,
        default: ""
    },
    superBulidup: {
        type: String,
        default: ""
    },
    carpetArea: {
        type: String,
        default: ""
    },
    workStatus: {
        type: String,
        default: ""
    },
    parking: {
        type: String,
        default: ""
    },
    capacityToAccommodate: {
        type: String,
        default: ""
    },
    accomodationType: {
        type: String,
        default: ""
    },
    amenities: {
        type: String,
        default: ""
    },
    employementType: {
        type: String,
        default: ""
    },
    experience: {
        type: String,
        default: ""
    },
    salary: {
        type: Number,
        default: 0
    },
    keySkill: {
        type: Array,
        default: []
    },
    jobBenefits: {
        type: String,
        default: ""
    },
    brand: {
        type: String,
        default: ""
    },
    condition: {
        type: String,
        default: ""
    },
    model: {
        type: String,
        default: ""
    },
    product: {
        type: String,
        default: ""
    },
    modelNumber: {
        type: String,
        default: ""
    }, 
    productType: {
        type: String,
        default: ""
    }, 
    size: {
        type: String,
        default: ""
    }, 
    title: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        default: ""
    }, 
    variant: {
        type: String,
        default: ""
    },
    fuelType: {
        type: String,
        default: ""
    }, 
    gearType: {
        type: String,
        default: ""
    }, 
    color: {
        type: String,
        default: ""
    },
    insuranceStatus: {
        type: String,
        default: ""
    }, 
    ownerType: {
        type: String,
        default: ""
    },
    partName: {
        type: String,
        default: ""
    }, 
    partNumber: {
        type: String,
        default: ""
    },
    suitableFor: {
        type: String,
        default: ""
    }, 
    yearMake: {
        type: String,
        default: ""
    }, 
    expiryDate: {
        type: String,
        default: ""
    }, 
    warrantyStatus: {
        type: String,
        default: ""
    }, 
    productPurpose: {
        type: String,
        default: ""
    }, 
    wheelSize: {
        type: String,
        default: ""
    }, 
    frameMaterial: {
        type: String,
        default: ""
    }, 
    carType: {
        type: String,
        default: ""
    }, 
    version: {
        type: String,
        default: ""
    }, 
    vehicleType: {
        type: String,
        default: ""
    },
},{  
    timestamps: true
})

//Auto Increment counter
postClassified.plugin(autoIncrement.plugin, 'postClassified');



//Declaration
POSTS = mongoose.model("postClassified", postClassified, "Posts");



module.exports = {
    POSTS,
}