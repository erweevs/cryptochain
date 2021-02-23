import React, { Component } from "react";
import { Link } from 'react-router-dom';
import Transaction from './Transaction'
import { Button} from 'react-bootstrap';
import history from '../history';

const POLL_INTERVAL_MS = 10000; // 10000 miliseconds = 10 seconds

class TransactionPool extends Component {
    state = { transactionPoolMap: {}};

    fetchTransactionPoolMap = () => {
        // fetch all the data from the api
        fetch(`${document.location.origin}/api/transaction-pool-map`)
        .then(response => response.json())
        .then(json => this.setState({ transactionPoolMap: json}));
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
        .then(response => {
            if(response.status === 200){
                alert('success');
                history.push('/blocks');
            } else{
                alert('Mine transacions Block request did not complete!');
            }
        });
    }

    componentDidMount(){
        this.fetchTransactionPoolMap();

        // run on this interval to fetch latest Pool Map data
        this.fetchPoolMapInterval = setInterval(
            // execution
            () => this.fetchTransactionPoolMap(),
            // interval in milliseconds
            POLL_INTERVAL_MS
        );
    }

    componentWillUnmount(){
        // clear the interval to stop the background interval running
        clearInterval(this.fetchPoolMapInterval);
    }

    render(){
        return(
            <div className='TransactionPool'>
                <div><Link to='/'>Home</Link></div>
                <h3>Transaction Pool</h3>
                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                        return(
                            <div key={transaction.id}>
                                <hr/>
                                <Transaction transaction={transaction}/>
                            </div>
                        )
                    })
                }
                <hr/>
                <Button
                    bsStyle="danger"
                    onClick={this.fetchMineTransactions}>
                        Mine the Transactions
                </Button>
            </div>
        );
    }
}

export default TransactionPool;