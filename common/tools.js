/**
 * @author: 卓文理
 * @email : 531840344@qq.com
 * @desc  : Description
 */

var fs = require('fs');
var path = require('path');
var http = require('http');
var Iconv = require('iconv').Iconv;

var tools = {
    getCaches: {},
    get: function(url, callback, encoding){
        // 去掉 hash
        url = url.replace(/#.*$/, '');

        var cache = this.getCaches;
        if (cache[url]) {
            // 异步，避免时序问题
            process.nextTick(function(){
                callback(null, cache[url]);
            });

            return;
        }

        http.get(url, function(res){
            var data = [];
            var dataLen = 0;

            var iconv;
            if (encoding) {
                iconv = new Iconv(encoding, 'utf-8');
            }

            res.on('data', function(chunk){
                if (iconv) {
                    try {
                        chunk = iconv.convert(chunk);
                    }
                    catch(ex) {}
                }

                dataLen +=chunk.length;
                data.push(chunk);
            }).on('end', function(){
                var buf = Buffer.concat(data, dataLen);

                cache[url] = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    content: buf
                };

                callback(null, cache[url]);
            });
        }).on('error', function(err){
            callback(err);
        });
    },
    // 同步保存文件
    writeFile: function(filePath, content){
        var destPath = path.dirname(filePath);

        this.mkDeepDir(destPath);

        // 同步写入文件
        fs.writeFileSync(filePath, content);
    },
    // 自动补全路径
    mkDeepDir: function(destPath){
        var tmpPath = '';
        var destPaths = [];
        var paths = destPath.replace(/\\+/g, '/').split('/');

        if (paths[0] === '') {
            paths[0] = '/';
        }

        while(paths.length) {
            destPaths.push(paths.shift());

            tmpPath = destPaths.join('/');

            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath);
            }
        }
    },
}

module.exports = tools;