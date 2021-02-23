const redis = require('redis');

// Creating default channels to subscribe and publish to
const CHANNELS ={
    TEST : "Test channel",
    BLOCKCHAIN : "BLOCKCHAIN",
    TRANSACTION: 'TRANSACTION'
};

class PubSub{
    constructor({blockchain, transactionPool}){
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        this.subscribeToChannels();

        // Describes the message event
        this.subscriber.on(
            'message', 
            (channel, message) => this.handleMessage(channel, message)
        );
    }

    // Handeling the message on the channel
    handleMessage(channel, message){
        // console.log(`Message received!! Channel: ${channel}. Message ${message}.`);

        const parsedMessage = JSON.parse(message);

        switch(channel){
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessage
                    });
                });
                break;

            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage);
                break;
            
            default:
                return;
        }
    }

    // Subscribing to each of the channels
    subscribeToChannels(){
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel);
        });
    }

    // Send a message over a designated channel
    publish({channel, message}){
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }

    // Allow the Blockchain to broadcast it's chain
    broadcastChain(){
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction){
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }
}

module.exports = PubSub;