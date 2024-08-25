const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// In-memory store for balance (for simplicity, not suitable for production)
const balances = {};

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Route to get balance for a specific address using bitcoin-cli
app.post('/get-balance', (req, res) => {
    const { address, username, password } = req.body;

    if (!address || !username || !password) {
        return res.status(400).json({ error: 'Address, username, and password are required' });
    }

    // Command to get the balance
    const command = `bitcoin-cli -rpcuser=${username} -rpcpassword=${password} -testnet getreceivedbyaddress ${address}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: 'Error fetching balance' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Error fetching balance' });
        }

        const balance = parseFloat(stdout.trim());
        balances[address] = balance;
        res.json({ balance });
    });
});

// Route to handle coin flip
app.post('/flip-coin', (req, res) => {
    const { address, amount, side, username, password } = req.body;

    if (!address || isNaN(amount) || !side || !username || !password) {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    // Check balance using bitcoin-cli
    if (balances[address] === undefined) {
        return res.status(400).json({ error: 'Address balance not found' });
    }

    const balance = balances[address];
    if (balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Simulate a coin flip
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    let txId = null;

    // Determine new balance
    let newBalance;
    if (coinResult === side) {
        newBalance = balance + amount;
    } else {
        newBalance = balance - amount;
    }

    // Transaction command
    const txCommand = `bitcoin-cli -rpcuser=${username} -rpcpassword=${password} -testnet sendtoaddress ${address} ${coinResult === side ? amount * 2 : amount}`;
    exec(txCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: 'Error processing transaction' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Error processing transaction' });
        }

        txId = stdout.trim();
        balances[address] = newBalance; // Update balance in the store
        res.json({ txId, coinResult, balance: newBalance });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
