'use strict';
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];
  zoomLevel = 15;
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevField);
    containerWorkouts.addEventListener(
      'click',
      function (e) {
        //we necessarily attach the click event not on with the element but with its whole parent box
        //int this case parent box will be
        const clickEdOn = e.target.closest('.workout');
        if (!clickEdOn) return;
        const workoutToFetch = this.#workouts.find(
          w => w.id === clickEdOn.dataset.id
        );

        this.#map.setView(workoutToFetch.coordinates, this.zoomLevel, {
          animate: true,
          pan: {
            duration: 1,
          },
        });
        workoutToFetch.click();
      }.bind(this)
    );
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Can't access you location!");
      }
    );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coordinates = [latitude, longitude];
    console.log(`Current coordinates : ${latitude} , ${longitude}`);
    this.#map = L.map('map').setView(coordinates, this.zoomLevel);
    console.log(this);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    form.classList.remove('form__row--hidden');
    this.#mapEvent = mapE;
    const { lat, lng } = mapE.latlng;
    form.classList.remove('hidden');
    // points to the distance field
    inputDistance.focus();
    L.marker([lat, lng]).addTo(this.#map);
  }
  _toggleElevField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    {
      e.preventDefault();
      //Get data from form
      const type = inputType.value;
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const { lat, lng } = this.#mapEvent.latlng;
      let workout;
      //check whether the data is valid

      const validateInput = (...inputs) =>
        inputs.every(i => Number.isFinite(i) && i > 0);
      //create running instance , or
      if (type == 'running') {
        const cadence = +inputCadence.value;
        if (!validateInput(distance, duration, cadence)) {
          return alert('Inputs have to be positive number');
        }
        //creating the appropriate workout class
        workout = new Running([lat, lng], distance, duration, cadence);

        // console.log(
        //   workout.type.slice(0, 1).toUpperCase() + workout.type.slice(1)
        // );
        //add it to the workout array
      }
      //create cycling instance
      if (type == 'cycling') {
        const elevation = +inputElevation.value;
        if (!validateInput(distance, duration)) {
          return alert('Inputs have to be positive number');
        }
        //creating the appropriate workout class
        workout = new Cycling([lat, lng], distance, duration, elevation);
        //add it to the workout array
      }
      //puting the workout into the workouts list
      this.#workouts.push(workout);

      //render the workout on the map
      this._renderWorkoutMarker(workout);
      this._renderWorkout(workout);
      this._hideForm();
      //hide forms and linear input fields
    }
  }

  //   _setDescription(workout) {
  //     return;
  //     workout.type.slice(0, 1).toUpperCase() + workout.type.slice(1);
  //   }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coordinates)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'}` +
          `${workout.type[0].toUpperCase() + workout.type.slice(1)} on ${
            workout.date
          } `
      )
      .openPopup();
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _renderWorkout(workout) {
    const html = ` <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${
            workout.type[0].toUpperCase() + workout.type.slice(1)
          } on ${workout.date}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type == 'running'
                ? workout.pace.toFixed(1)
                : workout.speed.toFixed(1)
            }</span>
            <span class="workout__unit">${
              workout.type == 'running' ? 'min/km' : 'km/h'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type == 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              workout.type == 'running'
                ? workout.cadence
                : workout.elevationGain
            }</span>
            <span class="workout__unit">${
              workout.type == 'running' ? 'spm' : 'm'
            }</span>
          </div>
        </li>`;
    form.insertAdjacentHTML('afterend', html);
  }
  _hideForm() {
    form.classList.add('form__row--hidden');
  }
}

const app = new App();

//////////////////////////////////////
//WORKOUT
const a = new Date();
console.log(Date.now());
console.log(typeof Date.now());

class Workout {
  date = String(new Date()).split(' ').slice(0, 4).join(' ');
  id = String(Date.now());
  #count = 0;
  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates; //[lat , lng]
    this.distance = distance;
    this.duration = duration;
  }
  click() {
    this.#count++;
  }
}
//////////////////////////////////////
//RUNNING WORKOUT
class Running extends Workout {
  type = 'running';
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    //(min/km)
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
//////////////////////////////////////
//CYCLING WORKOUT
class Cycling extends Workout {
  type = 'cycling';
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration);
    this.elevationGain = elevationGain;
    this.speed();
  }

  speed() {
    {
      //(km/hr)
      this.speed = this.distance / (this.duration / 60);
      return this.speed;
    }
  }
}
const run1 = new Running([39, -7], 5.34, 56, 178);
const cycle1 = new Cycling([39.0045, -7], 5.34, 56, 588);
console.log(run1, cycle1);
