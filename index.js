var cssToJss = require('jss-css/lib/cssToJss');

var jssRE = /\/\*\s*jss-css(?:\s+([\w:\s]+))?\s*\*\//;

module.exports = function (babel) {
  var t = babel.types;

  function convertToTree(obj) {
    var props = [];
    for (var key in obj) {
      var val = obj[key];
      props.push(t.property(
        'init',
        t.identifier(key),
        typeof val !== 'string' ? convertToTree(obj[key]) : t.literal(obj[key])
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
      if (options.named === false) {
        console.log(cssToJss(text, options));
      }
      return convertToTree(cssToJss(text, options));
    }

    return node;
  }
  
  return new babel.Transformer('plugin-jss-css', {
    Literal: function (node, parent) {
      var text = node.value;
      var isJssCss = typeof text === 'string' && jssRE.test(text);

      return getNode(isJssCss, text, node);
    },

    TemplateLiteral: function(node, parent) {
      var text = node.quasis[0].value.raw;
      var isJssCss = node.quasis.length === 1 && jssRE.test(text);

      return getNode(isJssCss, text, node);
    }
  });
};