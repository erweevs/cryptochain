import React, {Component} from 'React';

class Block extends Component{
    render(){
        const {timestamp, hash, data} = this.props.block;

        // display a substring of the hash on the UI
        const displayHash = `${hash.substring(0, 15)}...`;

        // display the data in a stringified manner
        const stringifiedData = JSON.stringify(data);

        const displayData = stringifiedData.length > 35 ? 
            `${stringifiedData.substring(0, 35)}...` :
            stringifiedData;

        // resturn to the UI
        return(
            <div className='Block'>
                <div>Hash: {displayHash}</div>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                <div>Data: {displayData}</div>
            </div>
        );
    }
};

export default Block;