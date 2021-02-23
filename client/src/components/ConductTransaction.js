import { json } from 'body-parser';
import React, {Component} from 'react';
import { FormGroup, FormControl, Button} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';

class ConductTransaction extends Component{
    state = {
        recipient : '',
        amount: 0
    };

    // saving what the user types on every key press
    updateRecipient = event => {
        this.setState({ recipient: event.target.value });
    }

    // saving what the user types on every key press
    updateAmount = event => {
        this.setState({ amount: Number(event.target.value) });
    }

    conductTransaction = () => {
        // grab the nessecary details from the UI
        const { recipient, amount } = this.state;

        // post the transaction data to the API
        fetch(`${document.location.origin}/api/transact`,{
            method: 'POST',
            headers: { 'Content-Type' : 'application/json'},
            body: JSON.stringify({ recipient, amount})
        }).then(response => response.json())
        .then(json => {
            alert(json.message || json.type);

            // navigate to the transaction-pool page after submission
            history.push('/transaction-pool');
        });
    }

    render(){
        return(
            <div className='ConductTransaction'>
                <Link to='/'>Home</Link>
                <h3>Conduct a Transaction</h3>
                <FormGroup>
                    <FormControl 
                        input='text'
                        placeholder='Recipient'
                        value={this.state.recipient}
                        onChange={this.updateRecipient}/>
                </FormGroup>
                <FormGroup>
                    <FormControl 
                            input='number'
                            placeholder='Amount'
                            value={this.state.amount}
                            onChange={this.updateAmount}/>
                </FormGroup>
                <div>
                    <Button bsStyle="danger"
                    onClick={this.conductTransaction}>
                        Submit
                    </Button>
                </div>
            </div>
        )
    }
};

export default ConductTransaction;