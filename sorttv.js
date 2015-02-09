var exec = require('./exec')

module.exports = {
    crawl: exec.bind(null, 'sudo perl /home/pi/sortTV/sorttv.pl >> /var/log/gustave/sorttv.log')
}
