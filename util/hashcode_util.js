const crypto = require('crypto');

exports.generateInviteCode  = function generateInviteCode(userId) {
    // 使用用户ID作为种子，生成哈希值
    const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex');
    // 取哈希值的一部分作为邀请码
    const inviteCode = hash.slice(0, 8).toUpperCase();
    return inviteCode;
}


