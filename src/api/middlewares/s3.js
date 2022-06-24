const AWS = require('aws-sdk');
const configs = require('../../configs/index.js');

const s3 = new AWS.S3({
    region: configs.REGION ,
    accessKeyId: configs.AWS_ACCESS_KEY,
    secretAccessKey: configs.AWS_SECRET_ACCESS_KEY
});

const { v4: uuidv4 } = require('uuid');

const s3Upload = (params, callback) => {
    s3.upload(params, function(err, data) {
        if(err){
            callback(err, '')
        }else{
            data.Location = configs.CDN+data.key
            callback('', data)
        }
    }); 
}

exports.save = function(bucketName, folder, file, callback, madatory,){
    if(madatory){
        if(file !== undefined){
            let myFile = file?.originalname?.split(".") || 'sharp'
            const fileType = myFile[myFile.length - 1]
        
            const params = {
                Bucket: bucketName,
                Key: folder+"/"+`${uuidv4()}.${fileType}`,
                Body: file?.buffer
            };
        
            s3Upload(params, callback)
        }
        else{
            callback(true)
        }
    }
    else {
        callback(false, {
            Location: '', 
        })
    }  
}

exports.delete = function(data, callback){
    if(data.Bucket){
        const params = {
            Bucket: data.Bucket, 
            Key: data.Key
           };
    
        s3.deleteObject(params, function(err, data) {
            if(err){
                callback(err, '')
            }else{
                callback('', data)
            } 
          });
    }
    else{
        callback()
    }
    
}