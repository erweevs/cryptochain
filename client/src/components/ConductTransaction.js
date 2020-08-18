import React, {Component} from 'react';
import { FormGroup, FormControl} from 'react-bootstrap';
import { Link } from 'react-router-dom';

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

    render(){
        // console.log('this.sate ', this.state);
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
            </div>
        )
    }
};

export default ConductTransaction;