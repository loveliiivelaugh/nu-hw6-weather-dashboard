//assign global variables to DOM elements
const form = document.querySelector("form");
const formInput = document.querySelector("#form-input");
const weatherCardsContainer = document.getElementById("5-day");
const weatherDetailsCard = document.getElementById('weather-details');
const searchHistoryList = document.querySelector("ul");
const spinner = document.getElementById("spinner");

console.info(moment().format("M/DD/YYYY"))
//function to handle a spinner if app is fetching weather data
const setIsFetching = (isFetching = false)  => {
  if (isFetching == true) {
    spinner.innerHTML = `<div>I am a spinner</div>` || "Loading...";
    spinner.display = "block";
  }
  else {
    spinner.display = "hidden";
  }
}
//handle local storage function for encapsulating the CRUD operations to be called in a clean way anywhere throughout our app. Also perfect solution to handle multiple local storage's.
const handleLocalStorage = (action, storageName, data) => {
  switch (action) {//CRUD
    case "initialize" ://Read
      return localStorage.getItem(storageName) ? 
      JSON.parse(localStorage.getItem(storageName)) : [];
    case "set" ://Create/Update
      return localStorage.setItem(storageName, JSON.stringify(data));
    case "get" ://Read
      return JSON.parse(localStorage.getItem(storageName));
    case "clear" ://Delete
      localStorage.clear(storageName)
      setCityHistoryList();
      break;
    default:
      break;
  }
};

//function to handle fetch
const handleFetch = async (type, city) => {
  key = '7d56f33a468c2d6fc63233a09c84c8dc';
  // setIsFetching(true);


  const getData = async url => {
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      console.info(data);
      // setIsFetching(false);
      if ( data.coord ) { setDetailsCard(data); }
      if ( data.list ) {
        const fiveDayData = convertToFiveDay(data);
        setWeatherCards(fiveDayData); 
      }
      return data;
    })
    .catch(exception => {
      console.error(exception);
      // setIsFetching(false);
    });
  };
  
  switch (type) {
    case "current": //current weather data
      // url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`;
      url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`;
      return getData(url);
    case "5-day forecast":
      url = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}`;
      //converts the data into a 5-day forecast
      return getData(url);
    default:
      break;
  }
};

//set initialized storage array to variable
const storage = handleLocalStorage("initialize", "searchHistory");
const lastSearchedIndex = storage.length;


//function that handles updating the search history list to the DOM.
const setCityHistoryList = storage => {
  const updatedStorage = handleLocalStorage("get", "searchHistory");
  let data = updatedStorage ? updatedStorage : storage;

  searchHistoryList.innerHTML = `
  ${data.map(history => 
      `<li class="list-group-item">${history.city}</li>`
    ).join("")}
    `;
  };
  
  setCityHistoryList(storage);
  
  const clearHistory = () => {
    handleLocalStorage('clear', 'searchHistory');
    setCityHistoryList();
  };

  const setDetailsCard = todaysWeather => {

    console.info(todaysWeather);

    const convertTemp = temp => ((temp *  9/5) - 459.67 );

    const fetchWeatherIcon = icon => `http://openweathermap.org/img/w/${icon}.png`;

    weatherDetailsCard.innerHTML = `
      <div class="card w-auto">
        <div class="card-body">
          <h4 class="display-4 card-title">${todaysWeather.name} (${moment().format("M/DD/YYYY")}) <img class="thumbnail" thumbnail src=${fetchWeatherIcon(todaysWeather.weather[0].icon)}  alt="Weather icon."></h4>
          <p class="lead">Temperature: ${convertTemp(todaysWeather.main.temp).toFixed(1)} F</p>
          <p class="card-subtitle mb-2">Humidity: ${todaysWeather.main.humidity}%</p>
          <p class="card-text">Wind Speed: ${todaysWeather.wind.speed} MPH</p>
          <p class="card-text">UV Index: <span class="span-uv-index">9.49</span></p>
        </div>
      </div>
    `;
  return;
};
  
const setWeatherCards = forecast => {

  console.info(forecast);

  const convertTemp = temp => ((temp *  9/5) - 459.67 );
  
  //const farenheit = Math.round(convertTemp(forecast.main.temp));
  //const feelsLikeF = Math.round(convertTemp(forecast.main.feels_like));

  const fetchWeatherIcon = icon => `http://openweathermap.org/img/w/${icon}.png`;

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

const convertToFiveDay = weatherData => {
  console.info(weatherData);
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

//funciton that contains the logic to set the city and get the weather
const handleSubmit = async event => {
  event.preventDefault();

  //push the captured form input to the storage
  storage.push({ city: formInput.value });
  //set the storage using our vanilla handleLocalStorage hook
  handleLocalStorage("set", "searchHistory", storage);

  //get weather data from API passing in the city
  await handleFetch("current", formInput.value);

  //get 5-day weather data from API passing in the city
  await handleFetch("5-day forecast", formInput.value);
  
  setCityHistoryList();
};

const onPageLoad = async event => {
  //gotta add this line to the top in a conditional to check if nothing searched yet then show the last city searched as the default city showing weather on screen load.
  const defaultCity = storage[lastSearchedIndex - 1].city ? storage[lastSearchedIndex - 1].city : "chicago";
  //get weather data from API passing in the city
  await handleFetch("current", defaultCity);

  //get 5-day weather data from API passing in the city
  await handleFetch("5-day forecast", defaultCity);
};
onPageLoad();
form.addEventListener("submit", event => handleSubmit(event));