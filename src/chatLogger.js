const fileSystem = require("fs")
const download = require("download-file")
const Date = require('moment')
const touch = require('touch')
const path = require('path')

module.exports = class ChatLogger {

	constructor(logsPath){
		this.logsPath = logsPath
	}

	formatTime(timestamp){
		// [HH:MM:SS GG/MM/AAAA]
		let date = new Date.unix(timestamp)

		return date.format("HH:mm:ss DD/MM/YYYY") + " "
	}

	ensureDirectoryExistence(filePath) {

		let dirname = path.dirname(filePath)

		if (fileSystem.existsSync(dirname)) {
			return true;
		}

		this.ensureDirectoryExistence(dirname)
		fileSystem.mkdirSync(dirname)

		return false

	}

	logText(fromUser, toUser, message, timestamp){

		let filePath = this.logsPath + "/" + fromUser.id + "/logs.txt"
		let filePartnerPath = this.logsPath + "/" + toUser.id + "/logs.txt"

		let logString = this.formatTime(timestamp) + `@${fromUser.username} (${fromUser.id}) => @${toUser.username} (${toUser.id}): ` + message
		if(this.ensureDirectoryExistence(filePath)) {

			// make the file if not exists
			touch.sync(filePath, {})

			fileSystem.appendFile(filePath, logString  + "\n", (err) => {
				if(err){
					console.log(`Something went wrong logging a text.`)
					console.log(err)
				}
			})

		}

		if(this.ensureDirectoryExistence(filePartnerPath)) {

			// make the file if not exists
			touch.sync(filePartnerPath, {})

			fileSystem.appendFile(filePartnerPath, logString  + "\n", (err) => {
				if(err){
					console.log(`Something went wrong logging a text.`)
					console.log(err)
				}
			})

		}

		console.log(logString)

		return true

	}


	logFile(fromUser, toUser, filePath, timestamp, type, fullURL){

		let logsPath = this.logsPath + "/" + fromUser.id + "/logs.txt"
		let logsPartnerPath = this.logsPath + "/" + toUser.id + "/logs.txt"

		let logString = this.formatTime(timestamp) + `@${fromUser.username} (${fromUser.id}) sent ${type} to @${toUser.username} (${toUser.id}), path: ` + filePath
		if(this.ensureDirectoryExistence(filePath)) {
			// make the file if not exists
			touch.sync(logsPath, {})

			fileSystem.appendFile(logsPath, logString  + "\n", function(err){
				if(err){
					console.log(`Something went wrong logging a ${type}.`)
					console.log(err)
					return false;
				}
			})

			download(fullURL, {
	            directory: this.logsPath + "/" + fromUser.id + "/" + type,
	            filename: filePath
	        })
		}

		if(this.ensureDirectoryExistence(filePath)) {
			// make the file if not exists
			touch.sync(logsPartnerPath, {})


			fileSystem.appendFile(logsPartnerPath, logString  + "\n", function(err){
				if(err){
					console.log(`Something went wrong logging a ${type}.`)
					console.log(err)
					return false;
				}
			})

			download(fullURL, {
	            directory: this.logsPath + "/" + toUser.id + "/" + type,
	            filename: filePath
	        })
		}

		console.log(logString)
		return true

	}
}
