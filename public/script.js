document.getElementById('connectWallet').addEventListener('click', async () => {
    const walletAddress = document.getElementById('walletAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (walletAddress && username && password) {
        document.getElementById('walletStatus').innerText = `Wallet Address: ${walletAddress}`;
        document.getElementById('homePage').style.display = 'none';
        document.getElementById('gamePage').style.display = 'block';
        
        // Set initial trial balance
        await loadBalance(walletAddress, username, password); // Fetch balance when wallet is connected
    } else {
        alert('Please enter a valid wallet address, username, and password.');
    }
});

async function loadBalance(walletAddress, username, password) {
    try {
        const response = await fetch('/get-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address: walletAddress, username, password }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.balance !== undefined) {
            let balance = data.balance;
            document.getElementById('balance').innerText = `${balance.toFixed(4)} BTC`;
            localStorage.setItem('balance', balance.toFixed(4)); // Store balance
        } else {
            console.error('Unexpected response format:', data);
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

document.getElementById('flipCoin').addEventListener('click', async () => {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const betSide = document.getElementById('betSide').value;
    const walletAddress = document.getElementById('walletAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (isNaN(betAmount) || betAmount <= 0) {
        document.getElementById('result').innerText = 'Please enter a valid bet amount.';
        return;
    }

    // Simulate coin flip
    const coinFlipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const coinElement = document.getElementById('coin');
    coinElement.classList.add('flip');
    setTimeout(async () => {
        coinElement.classList.remove('flip');

        // Determine win or lose
        const isWin = coinFlipResult === betSide;
        const resultText = isWin ? `You won! Coin landed on: ${coinFlipResult}.` : `You lost. Coin landed on: ${coinFlipResult}.`;
        document.getElementById('result').innerText = resultText;

        try {
            const response = await fetch('/flip-coin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: walletAddress, amount: betAmount, side: betSide, username, password }),
            });

            const data = await response.json();

            let balance = parseFloat(localStorage.getItem('balance')) || 10.0000;

            if (data.error) {
                document.getElementById('result').innerText = `Error: ${data.error}`;
            } else {
                if (isWin) {
                    balance += betAmount; // Increase balance on win
                } else {
                    balance -= betAmount; // Decrease balance on lose
                }
                document.getElementById('balance').innerText = `${balance.toFixed(4)} BTC`;
                localStorage.setItem('balance', balance.toFixed(4)); // Store updated balance

                // Update Bitcoin Core balance
                await loadBalance(walletAddress, username, password);
            }
        } catch (error) {
            console.error('Error processing transaction:', error);
            document.getElementById('result').innerText = 'Error processing transaction.';
        }
    }, 1000); // Delay to simulate the coin flip animation
});

document.getElementById('checkBalance').addEventListener('click', async () => {
    const walletAddress = document.getElementById('walletAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    await loadBalance(walletAddress, username, password);
});
