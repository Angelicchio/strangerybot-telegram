
module.exports = class Lobby {

    constructor(debug = true, admins = []) {

        // Log setting
        this.debug = debug

        // Lobbies
        this.lobbies = {}

        // Current user in queue
        this.userInQueue = {
            id: null,
            messageId: null
        }

        this.admins = admins

    }

    /**
     *
     * Log function based to the class settings.
     *
     * @param logMessage
     */
    log(logMessage) {

        if(this.debug) {

            console.log(logMessage)

        }

    }

    isAdmin(userId) {
        return this.admins.indexOf(userId) > -1
    }

    /**
     *
     * Add the user to lobby using callbacks to perform actions.
     *
     * @param userId
     * @param messageId
     * @param callback
     * @param callbackQueue
     * @returns {boolean}
     */
    addUserToLobby(userId, messageId, callback, callbackQueue) {

        this.log("addUserToLobby(userId): " + userId)
        this.log("addUserToLobby(messageId): " + messageId)

        if(this.hasUserInQueue(userId)) {

            // couple them
            let queueUser =  Object.assign({}, this.userInQueue)

            this.buildLobby(userId, queueUser.id)

            callback(queueUser.id, queueUser.messageId)

            return true

        }

        // put him in queue
        this.addUserToQueue(userId, messageId)

        callbackQueue()

        return false

    }

    /**
     *
     * Add the user to queue.
     *
     * @param userId
     * @param messageId
     */
    addUserToQueue(userId, messageId) {

        this.log("addUserToQueue(userId): " + userId)
        this.log("addUserToQueue(messageId): " + messageId)

        if(!userId || !messageId) {
            return
        }

        this.userInQueue.id = userId
        this.userInQueue.messageId = messageId

    }

    /**
     *
     * Check if the user is in a lobby or in queue.
     *
     * @param userId
     * @returns {boolean}
     */
    isUserInLobbyOrQueue(userId) {

        this.log("isUserInLobbyOrQueue(userId): " + userId)

        return this.isUserInQueue(userId) || this.isUserInLobby(userId)

    }

    /**
     *
     * Check if the user is in queue.
     *
     * @param userId
     * @returns {boolean}
     */
    isUserInQueue(userId) {

        this.log("isUserInQueue(userId): " + userId)

        return this.userInQueue.id === userId;

    }

    /**
     *
     * Check if the user in in lobby.
     *
     * @param userId
     * @returns {boolean}
     */
    isUserInLobby(userId) {

        this.log("isUserInLobby(userId): " + userId)

        return userId in this.lobbies

    }

    /**
     *
     * Check if there's an user in queue.
     *
     * @param exceptId User that will be excluded for the search.
     * @returns {null|boolean}
     */
    hasUserInQueue(exceptId) {

        this.log("hasUserInQueue(exceptId): " + exceptId)

        return this.userInQueue.id && (this.userInQueue.id !== exceptId)

    }

    /**
     *
     * Couple the users.
     *
     * @param userId1
     * @param userId2
     * @returns {boolean}
     */
    buildLobby(userId1, userId2) {

        this.log("buildLobby(userId1): " + userId1)
        this.log("buildLobby(userId2): " + userId2)

        if(this.userInQueue.id === userId1 || this.userInQueue.id === userId2) {

            this.userInQueue.id = null;
            this.userInQueue.messageId = null;

        }

        this.lobbies[userId1] = userId2;
        this.lobbies[userId2] = userId1;

        return true;

    }

    /**
     *
     * Destroy a lobby, based on userId.
     *
     * @param userId1
     * @returns {null}
     */
    destroyLobby(userId1, callback) {

        this.log("destroyLobby(userId1): " + userId1)

        let userId2 = this.lobbies[userId1];

        delete this.lobbies[userId1];
        delete this.lobbies[userId2];

        callback(userId2);

    }

    /**
     *
     * It removes the user from queue.
     *
     * @param userId
     * @returns {boolean}
     */
    removeUserFromQueue(userId) {

        this.log("removeUserFromQueue(userId): " + userId)

        if(this.userInQueue.id === userId) {

            this.userInQueue.id = null
            this.userInQueue.messageId = null

            return false

        }

        return true

    }

    /**
     *
     * Get the lobby correspondant.
     *
     * @param userId
     * @returns {*|boolean}
     */
    lobbyCorrespondant(userId) {

        this.log("lobbyCorrespondant(userId): " + userId)

        return this.lobbies[userId] || userId in this.lobbies
    }

}
