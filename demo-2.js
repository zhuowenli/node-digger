/**
 * @author: 卓文理
 * @email : 531840344@qq.com
 * @desc  : Description
 */

var URL = require('url');
var path = require('path');
var tools = require('./common/tools');

// 流程
// 1. 抓取首页
// 2. 写入文件，分析代码
// 3. 递归抓取外部资源

// 目标站点，必须以 / 结尾
var siteUrl = 'http://www.zhuowenli.com/';

// 最大深度
// var maxDeep = 3;

var digger = {
    stack: [],
    uriMap: {},
    add: function(url, parentUrl){
        // 去掉 hash
        url = url.replace(/#.*$/, '');

        // 检测url合法性
        if (!url) {
            return;
        }

        // 补全 /index.html
        if (url.slice(-1) == '/') {
            url += 'index.html';
        }

        // url计算比较复杂，但是困难的事情一般组建都帮忙干了...
        parentUrl = URL.resolve(siteUrl, parentUrl || '');
        url = URL.resolve(parentUrl, url);

        // 不加载外站资源
        if (url.indexOf(siteUrl) !== 0) {
            return;
        }

        // 内部以相对路径存储
        var uri = url.slice(siteUrl.length);

        var uriMap = this.uriMap;
        if (uriMap[uri]) {
            return;
        }

        uriMap[uri] = {
            status: 'loading'
        };

        this.stack.push(uri);

        console.log('加入队列：', uri);

        this.next();
    },

    // 限速、限流
    status: 'ready',
    next: function(){
        if (this.status !== 'ready') {
            return;
        }

        var self = this;
        var uri = this.stack.shift();

        if (!uri) {
            console.log('所有任务已完成！');

            return;
        }

        this.status = 'working';

        var url = URL.resolve(siteUrl, uri);

        console.log('开始加载资源：', uri);

        tools.get(url, function(err, data){
            if (err) {
                throw err;
            }

            self.saveContent(uri, data);

            var type = data.headers['content-type'];

            if (type && type.indexOf('text/html') === 0) {
                self.parseContent(data.content, uri);
            };

            self.status = 'ready';
            self.next();
        });
    },

    // 分析资源
    parseContent: function(content, uri){
        var self = this;
        var rRes = /(?:href|src)\s*=\s*(["'])(.+?)\1/ig;

        console.log('开始分析：', uri);

        // 找出所有资源链接
        var html = content.toString();
        var attrs = html.match(rRes);

        if (!attrs) {
            return;
        }

        // 加入队列
        attrs.forEach(function(attr){
            rRes.lastIndex = 0;

            if (rRes.test(attr)) {
                self.add(RegExp.$2, uri);
            }
        });
    },

    // 保存路径
    savePath: 'demo-2/',
    saveContent: function(uri, data){
        // 避免重复写入
        var map = this.uriMap[uri];
        if (map.status === 'saved') {
            return;
        }

        console.log('写入文件：', uri);

        var filePath = path.join(this.savePath, uri);
        tools.writeFile(filePath, data.content);
    }
};

digger.add(siteUrl);

