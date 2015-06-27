var cssToJss = require('jss-css/lib/cssToJss');

var jssRE = /\/\*\s*jss-css\s*\*\//;

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

  function getNode(isJssCss, text, node) {
    return isJssCss ? convertToTree(cssToJss(text)) : node;
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