// Imports
const Telegraf = require("telegraf")
const {Markup, Extra} = require("telegraf")
const http = require("http")
const https = require("https")
const Locale = require("./src/locale/en.json")
const Lobby = require("./src/lobby")
const ChatLogger = require("./src/chatLogger")
const CommandArgs = require("./src/middlewares/commandArgs")


// Variables
const StrangeryBot = new Telegraf("BOT_TOKEN") // Bot instance
const Admins = [
    123, 456
]
const StrangeryBotLobby = new Lobby(false, Admins) // Declaring Lobby
const Logger = new ChatLogger("./logs/")
const Banned = []

var inQueue = 0
var inChat = 0


// Bot middlewares
StrangeryBot.use(CommandArgs())


// Declaring inlineKeyboard formats
const SearchMenu = Extra.HTML().markup((Markup) => Markup.inlineKeyboard([Markup.callbackButton(Locale.searchStranger, "search_stranger")]))
const StopSearchMenu = Extra.HTML().markup((Markup) => Markup.inlineKeyboard([Markup.callbackButton(Locale.stopSearching, "stop_searching")]))


// Commands
StrangeryBot.start((context) => {

    let currentUserId = context.from.id,
        currentMessageId = context.message.message_id

    if(Banned.indexOf(currentUserId) > -1){
       return context.replyWithHTML(Locale.botChatPrefix + Locale.userBanned).catch((error) => {})
    }
	
    // If the current user is in queue.
    if(StrangeryBotLobby.isUserInQueue(currentUserId)) {
        return context.replyWithHTML(Locale.botChatPrefix + Locale.alreadyInQueue).catch((error) => {})
    }

    // If the current user is chatting.
    if(StrangeryBotLobby.isUserInLobby(currentUserId)) {
        return context.replyWithHTML(Locale.botChatPrefix + Locale.alreadyChatting, Extra.HTML()).catch((error) => {})
    }

    return context.replyWithHTML(Locale.botChatPrefix + Locale.startSearching, SearchMenu).catch((error) => {})

})

StrangeryBot.command('end', (context) => {

    // Remove user from lobbies array
    StrangeryBotLobby.destroyLobby(context.from.id, (partnerId) => {
        context.telegram.sendMessage(partnerId, Locale.botChatPrefix + Locale.chatEnded, Extra.HTML()).catch((error) => {})
        context.telegram.sendMessage(partnerId, Locale.botChatPrefix + Locale.startSearching, SearchMenu).catch((error) => {})
        inChat -= 2
    })
    return context.replyWithHTML(Locale.botChatPrefix + Locale.startSearching, SearchMenu).catch((error) => {})

})

StrangeryBot.command('ban', (context) => {
    if(StrangeryBotLobby.isAdmin(context.from.id)){

        let idToBan = parseInt(context.state.command.args[0])
        Banned.push(idToBan)
        if(StrangeryBotLobby.lobbyCorrespondant(idToBan)){
            StrangeryBotLobby.destroyLobby(idToBan, (partnerId) => {
                context.telegram.sendMessage(partnerId, Locale.botChatPrefix + Locale.partnerBanned, SearchMenu).catch((error) => {})
            })
        }

        context.telegram.sendMessage(idToBan, Locale.botChatPrefix + Locale.justBanned, Extra.HTML()).catch((error) => {})
    }
})

StrangeryBot.command('whois', (context) => {
    if(StrangeryBotLobby.isAdmin(context.from.id)){
        if(StrangeryBotLobby.lobbyCorrespondant(context.from.id)){
            context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(context.from.id)).then((partner) => {
                context.reply("ID: " + partner.id + "\nUsername: @" + partner.username + "\nNome: " + partner.first_name + "\nCognome: " + partner.last_name, Extra.HTML()).catch((error) => {})
            })
        }
    }


})

StrangeryBot.command('stats', (context) => {
    if(StrangeryBotLobby.isAdmin(context.from.id)){
        context.reply("In queue: " + inQueue + "\nIn chat: "+ inChat, Extra.HTML()).catch((error) => {})
    }
})


// InlineKeyboard replies
StrangeryBot.action("search_stranger", (context) => {

    let currentUserId = context.from.id,
        currentMessageId = context.update.callback_query.message.message_id

    if(Banned.indexOf(currentUserId) > -1){
        return context.editMessageText(Locale.botChatPrefix + Locale.userBanned, Extra.HTML()).catch((error) => {})
    }

    // If the current user is in queue.
    if(StrangeryBotLobby.isUserInQueue(currentUserId)) {
        return context.editMessageText(Locale.botChatPrefix + Locale.alreadyInQueue, Extra.HTML()).catch((error) => {})
    }

    // If the current user is chatting.
    if(StrangeryBotLobby.isUserInLobby(currentUserId)) {
        return context.editMessageText(Locale.botChatPrefix + Locale.alreadyChatting, Extra.HTML()).catch((error) => {})
    }

    StrangeryBotLobby.addUserToLobby(currentUserId, currentMessageId,
        (userId, messageId) => {

            // Edit queued user
            context.telegram.editMessageText(userId, messageId, null, Locale.botChatPrefix + Locale.userFound, Extra.HTML()).catch((error) => {})

            // And last user
            context.editMessageText(Locale.botChatPrefix + Locale.userFound, Extra.HTML()).catch((error) => {})
            inQueue--
            inChat += 2
        },
        () => {

            // Stop the search because the user is in queue
            context.editMessageText(Locale.botChatPrefix + Locale.searchingStranger, StopSearchMenu).catch((error) => {})
            inQueue++
    })

})

StrangeryBot.action("stop_searching", (context) => {
    // StrangeryBotLobby.destroyLobby(context.from.id)

    StrangeryBotLobby.removeUserFromQueue(context.from.id)
    inQueue--
    return context.editMessageText(Locale.botChatPrefix + Locale.searchAgainStranger, SearchMenu).catch((error) => {})
})

// Update types
StrangeryBot.on('text', (context) => {

    let currentUserId = context.from.id

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {
        context.telegram.sendMessage(StrangeryBotLobby.lobbyCorrespondant(currentUserId), Locale.strangerChatPrefix + context.message.text, Extra.HTML()).catch((error) => {})
        context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {

           return Logger.logText(context.from, partner, context.message.text, context.update.message.date)
        })
    }else{
        return context.replyWithHTML(Locale.botChatPrefix + Locale.notInChat, SearchMenu).catch((error) => {}).catch((error) => {})
    }

})

StrangeryBot.on('photo', (context) => {

    let currentUserId = context.from.id,
        currentFileId = context.message.photo.pop().file_id,
        currentFileName = currentFileId + ".jpg"

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {

        // save the file
        context.telegram.getFileLink(currentFileId).then((link) => {

            context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {

                Logger.logFile(context.from, partner, currentFileName, context.update.message.date, "photo", link)
            })

        })

        return context.telegram.sendPhoto(StrangeryBotLobby.lobbyCorrespondant(currentUserId), currentFileId, {
            caption: Locale.strangerSentPhoto
        }).catch((error) => {})

    }

})

StrangeryBot.on('video', (context) => {

    let currentUserId = context.from.id,
        currentFileId = context.message.video.file_id,
        currentFileName = currentFileId + ".mp4"

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {

        // save the file
        context.telegram.getFileLink(currentFileId).then((link) => {

            context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {

                Logger.logFile(context.from, partner, currentFileName, context.update.message.date, "video", link)
            })

        })

        return context.telegram.sendVideo(StrangeryBotLobby.lobbyCorrespondant(currentUserId), currentFileId, {
            caption: Locale.strangerSentVideo
        }).catch((error) => {})

    }

})

StrangeryBot.on('audio', (context) => {

    let currentUserId = context.from.id,
        currentFileId = context.message.audio.file_id,
        currentFileName = currentFileId + ".ogg"

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {

        // save the file
        context.telegram.getFileLink(currentFileId).then((link) => {

            context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {

                Logger.logFile(context.from, partner, currentFileName, context.update.message.date, "audio", link)

            })

        })

        return context.telegram.sendAudio(StrangeryBotLobby.lobbyCorrespondant(currentUserId), currentFileId).catch((error) => {})

    }

})

StrangeryBot.on('voice', (context) => {

    let currentUserId = context.from.id,
        currentFileId = context.message.voice.file_id,
        currentFileName = currentFileId + ".ogg"

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {

        // save the file
        context.telegram.getFileLink(currentFileId).then((link) => {

            context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {

                Logger.logFile(context.from, partner, currentFileName, context.update.message.date, "voice", link)
            })

        })

        return context.telegram.sendVoice(StrangeryBotLobby.lobbyCorrespondant(currentUserId), currentFileId).catch((error) => {})

    }

})

StrangeryBot.on('sticker', (context) => {

    let currentUserId = context.from.id,
        currentFileId = context.message.sticker.file_id

    if(StrangeryBotLobby.lobbyCorrespondant(currentUserId)) {
        context.telegram.getChat(StrangeryBotLobby.lobbyCorrespondant(currentUserId)).then((partner) => {
            Logger.logText(context.from, partner, "STICKER " + currentFileId, context.update.message.date)
        })

        return context.telegram.sendSticker(StrangeryBotLobby.lobbyCorrespondant(currentUserId), currentFileId).catch((error) => {})

    }

})


// Do not touch
// StrangeryBot.use(Telegraf.log())
StrangeryBot.startPolling()
