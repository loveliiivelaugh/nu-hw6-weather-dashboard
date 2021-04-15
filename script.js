//assign global variables to DOM elements
const form = document.querySelector("form");
const formInput = document.querySelector("#form-input");
const weatherCardsContainer = document.getElementById("5-day");
const weatherDetailsCard = document.getElementById('weather-details');
const searchHistoryList = document.querySelector("ul");
const spinner = document.getElementById("spinner");

//variable to hold temporary loading status 
let loading = false;
//function to update the loading status when called passing in a boolean.
const setLoading = isLoading => loading = isLoading;

//function to handle a spinner if app is fetching weather data
const setIsFetching = (loading)  => {
  if (loading == true) {
    spinner.innerHTML = `<div class="spinner-border text-primary"></div>` || "Loading...";
    spinner.display = "block";
  }
  else {
    spinner.display = "hidden";
  }
}
//handle local storage function for encapsulating the CRUD operations to be called in a clean way anywhere throughout our app. Also perfect solution to handle multiple local storage's.
const handleLocalStorage = (action, storageName, data) => {
  switch (action) {//CRUD
    case "initialize" ://Read/Create
      return localStorage.getItem(storageName) ? 
      JSON.parse(localStorage.getItem(storageName)) : [];
    case "set" ://Create/Update
      return localStorage.setItem(storageName, JSON.stringify(data));
    case "get" ://Read
      return JSON.parse(localStorage.getItem(storageName));
    case "clear" ://Delete
      localStorage.clear(storageName);
      setCityHistoryList();
      break;
    default:
      break;
  }
};

//function to handle fetch with multiple endpoints taking in the endpoint type and city
const handleFetch = async (type, city) => {
  //api key need to move this to make it not public when pushing like environment variable.
  const key = '7d56f33a468c2d6fc63233a09c84c8dc';
  //setLoading() and show the spinner or not
  setLoading(true);
  setIsFetching(loading);


  const getData = async url => {
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let lat = null;
        let lon = null;

        //if this is the call that returns coordinates
        if ( data.coord ) { 
          lat = data.coord.lat;
          lon = data.coord.lon;
          //dynamic url using the lat and long returned in the initital api call
          const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${key}`;
          fetch(url)
            .then(response => response.json())
            .then(uvi => uvi && data && setDetailsCard(data, uvi.current.uvi))
            .catch(exception => console.error(exception));
        }

        //if this is the call that returns a recipe list
        if ( data.list ) { return setWeatherCards(convertToFiveDay(data)); }//set the weather cards with the returned data but convert the data to a five day forecast because it returns every 3 hours over 5 days so needs conversion.

      })
      .catch(exception => console.error(exception));

      //once everything is all done fetching and waiting for the server to respond
      //update the status of loading and update displaying the spinner or not
      setLoading(false)
      setIsFetching(false);
  };

  //check the type if we need current weather or 5-day forecast
  switch (type) {
    case "current": //current weather data
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`;
      return getData(url);
    case "5-day forecast"://5-day forecast
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}`;
      //converts the data into a 5-day forecast
      return getData(url);
    default:
      break;
  }
};

//set initialized storage array to variable
const storage = handleLocalStorage("initialize", "searchHistory");
//use the length of the storage to dynamically set the index of the last searched item.
const lastSearchedIndex = storage.length;

// const removeDuplicates = array => array.filter((a, b) => console.log(array.indexOf(a), b));

//function that handles updating the search history list to the DOM.
const setCityHistoryList = storage => {
  //grab the current state of the searchHistory storage instance
  const updatedStorage = handleLocalStorage("get", "searchHistory");
  //set data to the value of updatedStorage if it is not null otherwise set it to the storage prop being passed in.
  let data = updatedStorage ? updatedStorage : storage;

  //set the innerHTML of the searchHistoryList in the DOM.
  searchHistoryList.innerHTML = `
    ${data.map(history => `<li class="list-group-item">${history.city}</li>` ).join("")}
  `;

};
//set the cityHistoryList on page load using the storage.  
setCityHistoryList(storage);
  
//handle clearing the search history
const clearHistory = () => {
  //clear the searchHistory local storage instance using the local storage wrapper function.
  handleLocalStorage('clear', 'searchHistory');
  //update the search history list
  setCityHistoryList();
};

//function that converts the returned kelvin temperature measurement type into farenheit.
const convertTemp = temp => ((temp *  9/5) - 459.67 );

//simple helper function to return the correct icon based on the iconId being passed to it.
const fetchWeatherIcon = icon => `https://openweathermap.org/img/w/${icon}.png`;

//function that handles setting the main weather details card. passing in todaysWeather, and uvi props.
const setDetailsCard = (todaysWeather, uvi) => {
    //set the innerHTML of the weatherDetailsCard in the DOM.
    weatherDetailsCard.innerHTML = `
      <div class="card w-auto">
        <div class="card-body">
          <h4 class="display-4 card-title">${todaysWeather.name} (${moment().format("M/DD/YYYY")}) <img class="thumbnail" thumbnail src=${fetchWeatherIcon(todaysWeather.weather[0].icon)}  alt="Weather icon."></h4>
          <p class="lead">Temperature: ${convertTemp(todaysWeather.main.temp).toFixed(1)} F</p>
          <p class="card-subtitle mb-2">Humidity: ${todaysWeather.main.humidity}%</p>
          <p class="card-text">Wind Speed: ${todaysWeather.wind.speed} MPH</p>
          <p class="card-text">UV Index: <span class="span-uv-index">${uvi}</span></p>
        </div>
      </div>
    `;
};
  
//function that handles setting the 5-day weather cards.
const setWeatherCards = forecast => {
  //set the innerHTML of the weatherCardsContainer in the DOM.
    weatherCardsContainer.innerHTML = `
      ${forecast.map(day => `
        <div class="card text-white bg-primary mb-3" style="width: 10rem; margin: 2%;">
          <div class="card-body">
            <h5 class="card-title">${moment(day.dt_txt).format("M/DD/YYYY")}</h5>
            <img class="thumbnail" src=${fetchWeatherIcon(day.weather[0].icon)} alt="Weather icon.">
            <p class="card-subtitle mb-2">Temp: ${convertTemp(day.main.temp).toFixed(2)} F</p>
            <p class="card-text">Humidity: ${(day.main.humidity).toFixed(0)}%</p>
            <p class="card-text"> ${day.weather[0].description}</p>
          </div>
        </div>
        `).join("")}
      `;
} ;     

//function that handles converting the returned 5-day every 3 hour weather forecast to just 5 days
const convertToFiveDay = weatherData => {
  //set empty array to hold 5 days worth of forecast data
  const forecast = []; 
  // to format the data structure to be strictly a 5-day forecast, we'll use this "for loop" to divide the 40 "3-hour" record lines by 8. Which will return just 5 days worth of data then.
  // We'll then need to append this newly formated data structure to an empty array variable to then later set in state.
  if (weatherData) {
    try { for (let i = 0; i < 40; i += 8) { forecast.push(weatherData.list[i]); } } 
    //handle any errors 
    catch (exception) { console.error(exception); }
  } else { alert("Something is Wrong!"); }
  return forecast;
};

//funciton that contains the logic to set the city and get the weather from the API.
const handleSubmit = async event => {
  event.preventDefault();

  //push the captured form input to the storage //threw in a little regex function to capitlaize the first letter of the city from the input.
  storage.push({ city: formInput.value.replace(/^\w/, c => c.toUpperCase()) });
  //set the storage using our vanilla handleLocalStorage hook
  handleLocalStorage("set", "searchHistory", storage);

  //get weather data from API passing in the city
  await handleFetch("current", formInput.value);

  //get 5-day weather data from API passing in the city
  await handleFetch("5-day forecast", formInput.value);
  
  //update the search history list.
  setCityHistoryList();

  formInput.value = '';
};

//function wrapping some of the functionality to be triggered on page load.
const onPageLoad = async event => {
  //gotta add this line to the top in a conditional to check if nothing searched yet then show the last city searched as the default city showing weather on screen load.
  const defaultCity = storage[lastSearchedIndex - 1].city ?  //if there is a city in storage
  storage[lastSearchedIndex - 1].city :  //set it to the last city that was searched in storage
  "chicago"; //if there are no cities in the search history storage then use the default city "Chicago".

  //get weather data from API passing in the city
  await handleFetch("current", defaultCity);

  //get 5-day weather data from API passing in the city
  await handleFetch("5-day forecast", defaultCity);
};
onPageLoad();

form.addEventListener("submit", event => handleSubmit(event));