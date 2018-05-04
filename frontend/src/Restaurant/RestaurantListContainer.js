import React, { Component } from "react";
import RestaurantList from "./RestaurantList";
class RestaurantListContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            listOfMatchingRestaurants: []
        };
    }

    componentDidMount = async() => {
    	console.log("---------componentDidMount");
        const { match } = this.props;
        console.log(match.params);
        const restaurant = match.params.restaurantInfo;
        const restaurantInfo = restaurant.split('&');
        const restaurantName = restaurantInfo[0];
        const location = restaurantInfo[1];
        console.log("---------restaurant: " + restaurantName);
        console.log("location is: " + location);
        if (restaurant) {
            fetch('/api/getRestaurants?term=' + restaurantName + "&location" + location)
            .then(response => {
                console.log(response.body);
            })
        }
        // if (restaurant) {
        //     const matches = await fetch('api/getRestaurants?term=' + restaurant);
        //     const body = await matches.json();
        //     console.log("---------componentDidMount:"+body);
        //     this.setState({
        //         listOfMatchingRestaurants: body
        //     });
        // }
    };
 

    componentWillReceiveProps = async newProps => {
        const currentMatch = this.props.match;
        const currentRestaurants = currentMatch.params.restaurantName;

        const newMatch = newProps.match;
        const newRestaurants = newMatch.params.restaurantName;
        if (newRestaurants && newRestaurants !== currentRestaurants) {
            const matches = await fetch('api/getRestaurants', {
                body: JSON.stringify({
                    term: newRestaurants,
                    location: 'jersey city, nj'
                })
            })
            const body = await matches.json();
            this.setState({
                listOfMatchingRestaurants: body
            });
        }
    };

    

    render() {
        if (!this.props.match.params.restaurantName) {
            return <h1>Search for restaurants</h1>;
        }
        
        const restaurants = this.state.listOfMatchingRestaurants;
        if (restaurants && restaurants.businesses){
            return <RestaurantList restaurantList={restaurants.businesses} />;
        }else{
            return <h1>Search for restaurants</h1>;
        }
    }
}

export default RestaurantListContainer;