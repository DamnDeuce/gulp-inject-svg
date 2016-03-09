var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var url = require('url');
var es = require('event-stream');
var iconv = require('iconv-lite');

module.exports = function(filePath) {

    var go = function(file, callback) {

        var markup = iconv.decode(file.contents, 'utf-8');

        if(markup.indexOf('�') > -1){
            markup = iconv.decode(file.contents, 'gbk');
            markupUtf8 = iconv.encode(markup, 'utf-8');
        }else {
          markupUtf8 = markup;
        }

        var dom = cheerio.load(markupUtf8, { decodeEntities: false });
        injectSvg(dom);
        file.contents = iconv.encode(dom.html(), 'gbk');
        return callback(null, file);
    };

    return es.map(go);

    function injectSvg(dom) {

        // Regexp for checking if the file ending has .svg
        var testSvg = /(?!.*[.](?:svg)$).*/;

        dom('img').each(function(idx, el) {
            el = dom(el)
            var src = el.attr('src');

            if (testSvg.test(src) && isLocal(src)) {
                var dir = path.dirname(src);

                var inlineTag;

                try {

                  inlineTag = fs.readFileSync("." + src).toString();

                } catch (e) {

                  inlineTag = "<!-- File "+ src + " was not found by gulp-inject-svg  -->";

                }

                el.replaceWith(inlineTag)
            }
        })
    }

    function isLocal(href) {
        return href && !url.parse(href).hostname;
    }
}
