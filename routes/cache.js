module.exports = (function () {
    var cache = {};
    var addToCache = function (name, elem) {
        "use strict";
        cache[name] = {elem: elem, timeToDie: (new Date)};
        },
        useInformationFromCache = function (name) {
            "use strict";
            if (cache[name] && (((new Date) - cache[name].timeToDie) < 5 * 60 * 1000)) {
                return cache[name].elem;
            } else {
                return false;
            }
        },
        removeInformationFromCache = function (name) {
            "use strict";
            delete cache[name];
        };
    return {
        add: addToCache,
        use: useInformationFromCache,
        remove: removeInformationFromCache
    };
})();