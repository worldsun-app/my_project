const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.addAdminRole = functions.https.onCall((data, context) => {
  // 檢查請求是否來自管理員
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '需要登入！');
  }

  // 獲取用戶並添加自定義聲明
  return admin.auth().getUserByEmail(data.email).then(user => {
    return admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });
  }).then(() => {
    return {
      message: `成功將 ${data.email} 設置為管理員`
    }
  }).catch(err => {
    return err;
  });
}); 