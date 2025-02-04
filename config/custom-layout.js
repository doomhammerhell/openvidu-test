var OPENVIDU_SERVER_URL = 'https://' + location.hostname + ':4443';
var OPENVIDU_SERVER_SECRET = 'MY_SECRET';

function restrictParticipantPermissions(connection) {
    // If the connection is not the host (you'll need to implement the host check logic)
    if (!connection.role !== 'MODERATOR') {
        connection.permissions = {
            publish: false,        // Cannot publish their own stream
            subscribe: true,       // Can subscribe to other streams
            forceUnpublish: false, // Cannot force other users to unpublish
            forceDisconnect: false // Cannot force other users to disconnect
        };
    }
}
