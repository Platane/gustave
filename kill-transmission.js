var exec = require('./exec')

module.exports = {
    stop: exec.bind(null, 'sudo service transmission-daemon stop'),
    reload: exec.bind(null, 'sudo service transmission-daemon reload')
}
