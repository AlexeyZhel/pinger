# Script which can be used to found search element rank in google search via proxies

Requirements:

Ruby 2.0.0 or higher 

SlimerJS 0.9.6

IMPORTANT:

This was only tested on ubuntu linux 12.10. Work on other platforms may be unstable.
If we want to use proxies for ip spoofing, we should be sure, that they can access google search page: google can show capcha for proxies, which made a lot of requests. So, best solution is to have own proxies (no access for others) to be sure that they will not be blocked. Other solution can be to establish vpn connections each time we execute query.
All other ip replacing will cause fail, because we can only send request, but will not get response (response will be sent to fake ip). 

Usage: ruby pinger.rb [options]

    -i, --input file.csv             Specifies input csv file.
    
    -o, --output file.csv            Specifies output csv file.
    
    -p, --proxy_list file.txt        Specifies file with working proxies.
    
    -t, --timeout ms                 Change default request timeout. Default is 2000 (2s)
    
    -f, --force                      Force overwrite output csv file.
    
    -h, --help, --usage              Show this usage message and quit.
    
    -v, --version                    Show version information about this program and quit.


JS script can be executed independently of ruby script:

Usage: slimerjs pinger.js [options]

     -k, --keyword        keyword as search parameter (google search string)

     -s, --search         address which should be found in google

     -z, --zipcode        used to get fake geolocation and pass it to slimerjs browser

     -t, --timeout        change default request timeout. Default is 2000 (2s)

     -h, --help           show this message

Please note, that all options (exclude help and timeout) are mandatory
