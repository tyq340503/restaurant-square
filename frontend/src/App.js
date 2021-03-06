import React, { Component } from 'react';
import "./App.css";
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Home from "./Home";
import NotFound from "./NotFound";
import Signup from './Users/Signup';
import Login from './Users/Login';
import Logout from './Users/Logout';
import Login_Error from './Users/Login_err';
import RestaurantPanel from './Restaurant/RestaurantPanel';
import Header from './Header';
import About from './About';
import SearchPage from './Restaurant/SearchPage';
import RestaurantListContainer from './Restaurant/RestaurantListContainer';
import Profile from './Users/Profile';

class App extends Component {
  
  constructor(props) {
    super(props);
  }
  state = {
    restaurant: '',
    location: ''
  };

  onSearch = (nameQuery, locationQuery) => {
    this.setState({
      restaurant: nameQuery,
      location: locationQuery
    });
  };

  render() {
    return (
      <div>
        <Header />
        <Router>
          <div className="App">
          {/* <p className="App-intro">{this.state.response}</p> */}
            <div className="App-body">
              <Switch>
                <Route exact path="/" component={Home}/>
                <Route path="/signup" component={Signup}/>
                <Route path="/login" component={Login}/>
                <Route path="/logout" component={Logout}/>
                <Route path="/login_err" component={Login_Error}/>
                <Route path='/searchPage' component={SearchPage}/>
                <Route path='/profile' component={Profile}/>
                <Route
                  path="/search/:restaurantInfo"
                  component={RestaurantListContainer}
                />
                <Route path="/display" component={RestaurantPanel}/>
                <Route path="/about" component={About}/>
                <Route path="*" component={NotFound} />
                        
              </Switch>
            </div>
          </div>
        </Router>

        <div className="body">
          <Helmet>
              <style>{'body { background-color: #E3DFDB; }'}</style>
          </Helmet>
        </div>
        <div className="footer" align="center">&copy; 2018 Tech Ninjas. All Rights Reserved.</div>

      </div>
  
    );
  }
}

export default App;
