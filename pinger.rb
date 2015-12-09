require 'open3'
require 'csv'
require 'optparse'

def get_options
  options = {:timeout => "2000"}

  OptionParser.new do |opts|
    opts.banner = "Usage: ruby pinger.rb [options]"

    opts.on("-i", "--input file.csv", "Specifies input csv file.") do |input|
      options[:input] = input
    end

    opts.on("-o", "--output file.csv", "Specifies output csv file.") do |output|
      options[:output] = output
    end

    opts.on("-p", "--proxy_list file.txt", "Specifies file with working proxies.") do |output|
      options[:proxy] = output
    end

    opts.on("-t", "--timeout ms", "Change default request timeout. Default is 2000 (2s)") do |output|
      options[:timeout] = output
    end

    opts.on("-f", "--force", "Force overwrite output csv file.") do |f|
      options[:force] = f
    end

    opts.on_tail("-h", "--help", "--usage", "Show this usage message and quit.") do
      puts opts.help
      exit 0
    end

    opts.on_tail("-v", "--version", "Show version information about this program and quit.") do
      puts "Pinger search v1.0.0"
      exit 0
    end
  end.parse!

  return options
end

def check_input_file(opts)
  if opts[:input].nil?
    puts "Input csv file is not specified"
    exit 1
  end

  unless File.exist?(opts[:input])
    puts "Please specify existed input csv file"
    exit 1
  end
end

def check_proxy_file(opts)
  if opts[:proxy].nil?
    puts "Proxy list file is not specified"
    exit 1
  end

  unless File.exist?(opts[:proxy])
    puts "Please specify existed proxy list file"
    exit 1
  end
end

def check_output_file(opts)
  if opts[:output].nil?
    puts "Output csv file is not specified"
    exit 1
  end

  if File.exist?(opts[:output]) && !opts[:force]
    puts "Output csv file already exists. Please specify another file or use --force key"
    exit 1
  end
end

def create_output_csv(file)
  CSV.open(file, "wb") do |csv|
    csv << ["fg_id", "business name", "DID" , "street", "city", "state", "zipcode", "result", "rank", "ip address"]
  end
end

def write_output_raw(file, array, status, rank, ip)
  array.pop
  CSV.open(file, "a+") do |csv|
    if status.success? && rank.to_i > 0
      array.push('Yes')
      array.push(rank.to_i)
    else
      array.push('No')
      array.push(0)
    end
    array.push(ip)
    csv << array
  end
end

def get_proxy_array(file)
  return_arr = []
  File.open(file).each do |line|
    return_arr << line.gsub("\n",'')
  end
  return_arr
end

def transform_did(did)
  "#{did[0..2]}-#{did[3..5]}-#{did[6..9]}"
end

def replace_spaces_by_plus(keyword)
  keyword.downcase.tr(" ", "+")
end

def parse_input_csv(input, output, proxy, timeout)
  skip_title = true
  proxy_arr = get_proxy_array proxy if proxy
  CSV.foreach(input) do |row|
    if skip_title
      skip_title = false
      next
    end
    proxy_str = ""

    biz_name = row[1]
    did = transform_did row[2]
    zip_code = row[6]
    keyword = row[7]

    keyword ||= "#{biz_name} #{zip_code}"
    replaced_keyword = replace_spaces_by_plus keyword
    if proxy
      proxy_ip = proxy_arr.sample
      proxy_str = "--proxy=#{proxy_ip}"
    end

    puts "Execute: slimerjs #{proxy_str} pinger.js --keyword \"#{replaced_keyword}\" --search \"#{did}\" --zipcode #{zip_code} --timeout #{timeout}"

    stdout, stdeerr, status = Open3.capture3("slimerjs #{proxy_str} pinger.js --keyword \"#{replaced_keyword}\" --search \"#{did}\" --zipcode #{zip_code} --timeout #{timeout}")
    write_output_raw output, row, status, stdout, proxy_ip
  end
end

options = get_options

puts options

check_input_file options
check_output_file options
check_proxy_file options if options[:proxy]
create_output_csv options[:output]
parse_input_csv options[:input], options[:output], options[:proxy], options[:timeout]





