var cssToJss = require('jss-css/lib/cssToJss');

var jssRE = /\/\*\s*jss-css(?:\s+([\w:\s]+))?\s*\*\//;

module.exports = function (babel) {
  var t = babel.types;

  function convertToTree(obj) {
    var props = [];
    for (var key in obj) {
      var val = obj[key];
      props.push(t.objectProperty(
        t.stringLiteral(key),
        typeof val !== 'string' ? convertToTree(obj[key]) : t.stringLiteral(obj[key])
      ))
    }
    return t.objectExpression(props);
  }

  function parseVal(val) {
    if (val === undefined || val === 'true') {
      return true;
    } else if (val === 'false') {
      return false;
    }

    return val;
  }

  function getNode(isJssCss, text, node) {
    if (isJssCss) {
      var options = (text.match(jssRE)[1] || '').split(/\s+/).reduce(function(obj, p) {
        if (p) {
          var keyVal = p.split(':');
          obj[keyVal[0]] = parseVal(keyVal[1]);
        }
        return obj;
      }, {});
      return convertToTree(cssToJss(text, options));
    }

    return node;
  }
  
  return {
    visitor: {
      Literal: function (path) {
        var text = path.node.value;
        var isJssCss = typeof text === 'string' && jssRE.test(text);

        path.replaceWith(getNode(isJssCss, text, path.node));
      },

      TemplateLiteral: function(path) {
        var text = path.node.quasis[0].value.raw;
        var isJssCss = path.node.quasis.length === 1 && jssRE.test(text);

        path.replaceWith(getNode(isJssCss, text, path.node));
      }
    }
  };
};