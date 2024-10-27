const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');

const web3 = new Web3(ganache.provider());

// const { abi, bytecode, evm } = require('../compile.js');
const { abi, bytecode, evm } = require('../Lottery.json');

let lottery;
let defaultAccount;
let accounts;

let lotteryContract = new web3.eth.Contract(abi);

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    defaultAccount = accounts[0];

    // Deploy
    const contractDeployer = lotteryContract.deploy({
        data: '0x' + bytecode
    });

    // Get Gas
    const gas = await contractDeployer.estimateGas({
        from: defaultAccount,
    });
    console.log('Estimated gas:', gas);

    try {
        lottery = await contractDeployer.send({
            from: defaultAccount,
            gas,
            gasPrice: 20000000000,
        });
        console.log('Contract deployed at address: ' + lottery.options.address);
    } catch (error) {
        console.error(error);
    }
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });


    it('allows multiple account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        })
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minium amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei('0.002', 'ether')
            });

            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });

            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it('sends money to the winner and resets the players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        })

        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether'));
    });

    it('sends money to the winner and resets the players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        })

        const initialContractBalance = await web3.eth.getBalance(lottery.options.address);
        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance;

        // Get Players after.
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        const finalContractBalance = await web3.eth.getBalance(lottery.options.address);

        assert(difference > web3.utils.toWei('1.8', 'ether'));

        assert.equal(0, players.length);

        assert(initialBalance > finalContractBalance);
        assert.equal(0, finalContractBalance);
    });
});