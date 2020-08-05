import React, {Component} from 'react';

// declare the React component
class App extends Component {
    // add the sate
    state = {
        walletInfo:{ }
    };

    // this fires when the componenet has been inserted into the main document
    componentDidMount(){
        fetch('http://localhost:3000/api/wallet-info')
        .then(response => response.json())
        .then(json => this.setState({walletInfo: json}));
    };

    render(){
        const {address, balance} = this.state.walletInfo;

        return(
            <div>
                <div>Welcome to the Blockchain</div>
                <div>Address: {address}</div>
                <div>Balance: {balance}</div>
            </div>
        );
    }
}

export default App;