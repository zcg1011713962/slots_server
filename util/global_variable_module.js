let myGlobalVariable = [];

// 设置全局变量的值
function setGlobalVariable(value) {
    myGlobalVariable = JSON.parse(value);
}

// 获取全局变量的值
function getGlobalVariable() {
    return myGlobalVariable;
}

// 导出方法
module.exports = {
    setGlobalVariable,
    getGlobalVariable
};