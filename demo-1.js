/**
 * @author: 卓文理
 * @email : 531840344@qq.com
 * @desc  : Description
 */

var fs = require('fs');
var tools = require('./common/tools');

var url = 'http://www.zhuowenli.com';

console.log('Start Loading...');

tools.get(url, function(err, data){
    if (err) {
        throw err;
    }

    console.log('Loaded:', data);

    console.log('--------------');

    var filePath = 'demo-1.html';

    fs.writeFile(filePath, data.content, function(){
        console.log('写入文件：', filePath);
    });
});