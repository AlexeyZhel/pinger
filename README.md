# Script which can be used to found search element rank in google search via "google proxies"

Requirements:

Ruby 2.0.0 or higher 

Phantomjs 2.0.0 or higher (this is important, because phantomjs 1.9.X does not work correctly with google fonts by some reasons)

IMPORTANT
This was only tested on linux 12.10. Work on other platforms may be unstable.

Usage: ruby pinger.rb [options]

    -i, --input file.csv             Specifies input csv file.
    
    -o, --output file.csv            Specifies output csv file.
    
    -p, --proxy_list file.txt        Specifies file with working proxies.
    
    -t, --timeout ms                 Change default request timeout. Default is 2000 (2s)
    
    -f, --force                      Force overwrite output csv file.
    
    -h, --help, --usage              Show this usage message and quit.
    
    -v, --version                    Show version information about this program and quit.


JS script can be executed independently of ruby script:

Usage: phantomjs pinger.js [options]

     -k, --keyword        keyword as search parameter (google search string)

     -s, --search         address which should be found in google

     -z, --zipcode        used to get fake geolocation and pass it to phantom browser

     -t, --timeout        change default request timeout. Default is 2000 (2s)

     -h, --help           show this message

Please note, that all options (exclude help and timeout) are mandatory
