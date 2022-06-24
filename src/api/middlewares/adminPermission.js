const { ADMINACCOUNT } = require("../models/admin/auth")
const translate = require("../../constants");
const { CFAM } = require("../dao");


const common = [
    '/createRole', '/editRole', '/createAdminUser', '/editAdminUser', '/getCreatedAdminRole', '/getAllAdminUser', '/getCreatedAdminRoleById',
    '/createCategory', '/editCategory', '/deleteCategory', '/getAllCategory_Subcategory', '/updateCatStatus', '/createQuestion', '/getAllQuestionField', '/editQuestionField',
    '/addQuestionToCategory', '/deleteSubcategory', '/getAllAddedQuestionById', '/getUserList', '/getActivePost', '/getInactivePost', '/getActivePostByUserId', '/getInactivePostByUserId',
    '/getInactiveTaskByUserId', '/getInactiveTask', '/getActiveTaskByUserId', '/getActivetask', '/createSellerSubscription', '/getAllSellerSubscription', '/statusUpdateSellerSubscription',
    '/editSellerSubscription', '/deleteSellerSubscription', '/createTaskerSubscription', '/editTaskerSubscriotion', '/deleteTaskerSubscription',
    '/statusUpdateTaskerSubscription', '/getAllTaskersubscription', '/createQuestionField', '/postFAQ', '/getFAQ', '/editFAQ', '/deleteFAQ', '/addNewCoupon',
    '/editCoupon', '/deleteOneCoupon', '/getAllCoupon', '/getAdminNotification', '/updateNotificationStatus', '/editAddedQuestions', '/createBadges', '/editBadges', '/deleteBadges',
    '/getAddedBadges', '/updateBadgeStatus', '/getBadgeRequestByuserId', '/updateStatusForRequest','/addTermsAndConditons','/editTermsAndConditons','/getTermsAndConditons','/addPrivacy',
    '/editPrivacy','/getPrivacy','/addAboutUs','/editAboutUs','/getAboutUs'
]

const superAdmin = [

]


const maneger = [
    
]


const findWhere = async (url, adminId, lang, res, next) => {
    let data = {
        query: { _id: adminId },
        update: undefined,
        sort: { createdAt: -1 }
    }

    let result = await CFAM(ADMINACCOUNT, 'findOne', data, lang)
    let role = result?.data?.role || ''

    return new Promise(async (resolve, reject) => {
        if (common.includes(url)) {
            if (role == '_superAdmin_' || role == '_manager_') {
                next()
            } else {
                res.status(401).json({
                    error: true,
                    message: translate[lang || 'en'].NOTAUTH,
                });
            }
        } else if (superAdmin.includes(url)) {
            if (role == '_superAdmin_') {
                next()
            } else {
                res.status(401).json({
                    error: true,
                    message: translate[lang || 'en'].NOTAUTH,
                });
            }
        } else if (maneger.includes(url)) {
            if (role == '_manager_') {
                next()
            } else {
                res.status(401).json({
                    error: true,
                    message: translate[lang || 'en'].NOTAUTH,
                });
            }
        } else {
            res.status(401).json({
                error: true,
                message: translate[lang || 'en'].NOTALLOWANYONE + ' || ' + translate[lang || 'en'].PROVIDEVALIDADMIN,
            });
        }
    });
}


module.exports = async function (req, res, next) {

    let { lang } = (Object.keys(req.body).length === 0) ? req.query : req.body

    let { adminId } = req.auth;
    
    try {
        await findWhere(req._parsedUrl.pathname, adminId, lang, res, next)
    } catch (error) {
        res.status(401).json({
            message: error.message,
        });
    }
};
