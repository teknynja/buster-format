if (typeof buster == "undefined") {
    var buster = {};
}

if (typeof require != "undefined") {
    buster.util = require("buster-util");
}

buster.format = buster.format || {};
buster.format.excludeConstructors = ["Object", /^.$/];

buster.format.ascii = (function () {
    function keys(object) {
        var k = Object.keys && Object.keys(object) || [];

        if (k.length == 0) {
            for (var prop in object) {
                if (object.hasOwnProperty(prop)) {
                    k.push(prop);
                }
            }
        }

        return k.sort();
    }

    function isCircular(object, objects) {
        if (typeof object != "object") {
            return false;
        }

        for (var i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) {
                return true;
            }
        }

        return false;
    }

    function ascii(object, processed) {
        if (typeof object == "string") {
            return '"' + object + '"';
        }

        if (typeof object == "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) {
            return "[Circular]";
        }

        if (Object.prototype.toString.call(object) == "[object Array]") {
            return ascii.array(object);
        }

        if (!object) {
            return "" + object;
        }

        if (buster.util.isElement(object)) {
            return ascii.element(object);
        }

        if (object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        return ascii.object.call(this, object);
    }

    ascii.func = function (func) {
        return "function " + ascii.functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var pieces = [];

        for (var i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii(array[i], processed));
        }

        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = keys(object), prop, str, obj;
        var is = "";
        var length = 3;

        for (var i = 0, l = indent; i < l; ++i) {
            is += " ";
        }

        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii.call(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = ascii.constructorName.call(this, object);
        var prefix = cons ? "[" + cons + "] " : ""

        return (length + indent) > 80 ?
            prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" + is + "}" :
            prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attribute, pairs = [];

        for (var i = 0, l = attrs.length; i < l; ++i) {
            attribute = attrs.item(i);

            if (!!attribute.nodeValue) {
                pairs.push(attribute.nodeName + "=\"" + attribute.nodeValue + "\"");
            }
        }

        var formatted = "<" + tagName + (l > 0 ? " " : "");
        var content = element.innerHTML.substr(0, 20);
        return formatted + pairs.join(" ") + ">" + content + "</" + tagName + ">";
    };

    ascii.functionName = function (func) {
        if (!func) {
            return "";
        }

        var name = func.displayName || func.name;

        if (!name) {
            var matches = func.toString().match(/function ([^\s\(]+)/);
            name = matches && matches[1] || "";
        }

        return name;
    };

    ascii.constructorName = function (object) {
        var name = ascii.functionName(object && object.constructor);
        var excludes = this.excludeConstructors || [];

        for (var i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] == "string" && excludes[i] == name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    };

    return ascii;
}());

if (typeof module != "undefined") {
    module.exports = buster.format;
}