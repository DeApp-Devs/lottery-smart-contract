const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth
    .Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  })

  it('allows an account to enter the lottery', async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether')});

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.strictEqual(accounts[0], players[0]);
    assert.strictEqual(1, players.length);
  });

  it('allows multiple accounts to enter', async() => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') });

    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });

    await lottery.methods
      .enter()
      .send({ from: accounts[2], value: web3.utils.toWei('0.02', 'ether') });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.strictEqual(accounts[0], players[0]);
    assert.strictEqual(accounts[1], players[1]);
    assert.strictEqual(accounts[2], players[2]);
    assert.strictEqual(3, players.length);
    });

    it('requires a minimum amount of ether to enter', async () => {
      let isPlayerEntered;
      try {
        await lottery.methods.enter().send({
          from: accounts[0],
          value: '10'
        });
        isPlayerAdded = true;
      } catch (err) {
        isPlayerEntered = false
      }
      assert.strictEqual(false, isPlayerEntered);
    });

    it('throws an error if an address that is not the manager address attempts to pick a winner', async () => {
      await lottery.methods
        .enter()
        .send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') });

      await lottery.methods
        .enter()
        .send({ from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });

      let isWinnerPicked;
      try {
        await lottery.methods.pickWinner().send({ from: accounts[1] });
        isWinnerPicked = true;
      } catch (err) {
        isWinnerPicked = false
      }
      assert.strictEqual(false, isWinnerPicked);
    });

    it('sends money to the winner and resets the players array', async () => {
      await lottery.methods
      .enter()
      .send({ from: accounts[0], value: web3.utils.toWei('1', 'ether') });

      const initialBalance = await web3.eth.getBalance(accounts[0]);
      await lottery.methods.pickWinner().send({ from: accounts[0] });
      const finalBalance = await web3.eth.getBalance(accounts[0]);
      const difference = finalBalance - initialBalance;

      assert(difference > web3.utils.toWei('0.9', 'ether'));

      const players = await lottery.methods
        .getPlayers()
        .call({ from: accounts[0] });

      assert.strictEqual(0, players.length);
    });
});
