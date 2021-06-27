import React from "react";

import logo from "./logo.svg";
import lottery from './lottery';
import web3 from "./web3";

import "./App.css";

class App extends React.Component {
  state = {
    manager: ''
  };

  async componentDidMount() {
    const manager = await lottery.methods.manager().call();
    this.setState({ manager });
  }
  
  render() {
    return (
      <div>
        <h2>Lottery Contract</h2>
        <p>This contract is managed by: {this.state.manager}</p>
      </div>
    );
  }
}
export default App;
