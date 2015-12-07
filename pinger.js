var system = require('system'),
    args = system.args,
    url = 'http://www.google.com/',
    page = new WebPage(),
    requestTimeOut = 2000,
    searchAddress,
    keyword,
    zipcode;

page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36"
page.settings.javascriptEnabled = true;
page.settings.loadImages = false;

for (var i = 1; i < args.length; i++) {
    switch (args[i]) {
        case '-k':
        case '--keyword':
            keyword = args[i + 1];
            i++;
            break;
        case '-s':
        case '--search':
            searchAddress = new RegExp(args[i + 1]);
            i++;
            break;
        case '-z':
        case '--zipcode':
            zipcode = args[i + 1];
            i++;
            break;
        case '-t':
        case '--timeout':
            requestTimeOut = args[i + 1];
            i++;
            break;
        case '-h':
        case '--help':
            usage();
            break;
    }
}
// test func for evaluate
//var system = require('system'); //
//page.onConsoleMessage = function (msg) {
//    system.stderr.writeLine('console: ' + msg);
//};

if (searchAddress !== undefined && keyword !== undefined && zipcode !== undefined) {
    getCoordsAndExecuteMain(zipcode, main);
} else {
    usage();
}

function getCoordsAndExecuteMain(zipcode, mainFn) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            mainFn(xmlHttp.responseText);
    }
    xmlHttp.open("GET", "http://maps.googleapis.com/maps/api/geocode/json?address=" + zipcode, true);
    xmlHttp.send(null);
}


function usage() {
    console.log('Usage: phantomjs pinger.js [OPTIONS]');
    console.log('-k, --keyword        keyword as search parameter (google search string)');
    console.log('-s, --search         address which should be found in google');
    console.log('-z, --zipcode        used to get fake geolocation and pass it to phantom browser');
    console.log('-t, --timeout        change default request timeout. Default is 2000 (2s)');
    console.log('-h, --help           show this message');
    console.log('Please note, that all options (exclude help and timeout) are mandatory');
    phantom.exit(1);
};

function notFoundExit() {
    console.log(0);
    phantom.exit(0);
};

function indexFoundExit(index) {
    console.log(index);
    phantom.exit(0);
};

function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var str = 'function() { return (' + func.toString() + ')(';
    for (var i = 0, l = args.length; i < l; i++) {
        var arg = args[i];
        if (/object|string/.test(typeof arg)) {
            str += 'JSON.parse(\'' + JSON.stringify(arg) + '\'),';
        } else {
            str += arg + ',';
        }
    }
    str = str.replace(/,$/, '); }');
    return page.evaluate(str);
};

function clickElement(el) {
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
    el.dispatchEvent(ev);
};

function navigateToSearch(page, searchString) {
    evaluate(page, function () {
        document.getElementById('lst-ib').value = arguments[0];
        document.getElementsByTagName('form')[0].submit();
    }, searchString);
};

function clickOnMoreHref(page) {
    evaluate(page, function () {
        arguments[0](document.getElementsByClassName('_wNi')[0].getElementsByTagName('a')[0]);
    }, clickElement);
};

function clickOnNextPageLink(page) {
    evaluate(page, function () {
        arguments[0](document.getElementById('pnnext'));
    }, clickElement);
};

function getMorePlacesHrefElement() {
    var hrefEl = page.evaluate(function () {
        return document.getElementsByClassName('_wNi')[0];
    });
    return hrefEl;
};

function getNextPageHrefElement() {
    var hrefEl = page.evaluate(function () {
        return document.getElementById('pnnext');
    });
    return hrefEl;
};

function getSearchQuery(page, startIndex) {
    var searchQuery = evaluate(page, function () {
        var query = document.getElementsByClassName('_gt');
        var ret = {};

        for (var i = arguments[0]; i < (query.length + arguments[0]); i++) {
            try {
                ret[i] = query[i - arguments[0]].getElementsByClassName('_lfe')[0].innerHTML;
            } catch (err) {
            }
        }

        return ret;
    }, startIndex);
    return searchQuery;
};

function findSearchIndex(hash, string) {
    var lastIndex;
    for (var key in hash) {
        if (searchAddress.test(hash[key])) {
            indexFoundExit(parseInt(key));
        }
        lastIndex = key;
    }
    return parseInt(lastIndex);
};

function findOnNextPage(lastHashIndex) {
    if (getNextPageHrefElement()) {
        clickOnNextPageLink(page);
        window.setTimeout(function () {
                var lastIndex = findSearchIndex(getSearchQuery(page, lastHashIndex + 1));
                findOnNextPage(lastIndex);
            },
            requestTimeOut
        );
    } else {
        notFoundExit();
    }
};

function setFakeCoords(coordsJson, page) {
    var response = JSON.parse(coordsJson),
        coords = response.results[0].geometry.location,
        lat = coords.lat,
        lng = coords.lng;

    evaluate(page, function () {
        window.navigator.geolocation = function (latitude, longitude) {
            var pub = {};
            var current_pos = {
                coords: {
                    latitude: latitude,
                    longitude: longitude
                }
            };
            pub.getCurrentPosition = function (locationCallback, errorCallback) {
                locationCallback(current_pos);
            };
            return pub;
        }(arguments[0], arguments[1]);
    }, lat, lng);
};


function main(coordsJson) {
    setFakeCoords(coordsJson, page);
    page.open(url, function (status) {
        if (status !== 'success') {
            phantom.exit(1);
        }
        else {
            window.setTimeout(function () {
                    navigateToSearch(page, keyword);
                    window.setTimeout(function () {
                            findSearchIndex(getSearchQuery(page, 1));
                            if (getMorePlacesHrefElement()) {
                                clickOnMoreHref(page)
                                window.setTimeout(function () {
                                        var lastIndex = findSearchIndex(getSearchQuery(page, 1));
                                        findOnNextPage(lastIndex);
                                    },
                                    requestTimeOut
                                );
                            } else {
                                notFoundExit();
                            }
                        },
                        requestTimeOut
                    );
                },
                requestTimeOut
            );
        }
    });
};