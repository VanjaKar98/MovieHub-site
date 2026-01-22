const OVERLAY = document.querySelector(".overlay");

let moviesList = [];
let renderedMovies = [];
let updated = true;
let isEditing;
let putId;

document.addEventListener("DOMContentLoaded", async () => {
  await handleGetData();
  handleOverlay();
});

function handleOverlay() {
  let visited = localStorage.getItem("visited");
  if (!visited) {
    const delay = Math.ceil(Math.random() * (4000 - 1000) + 1000);
    setTimeout(() => {
      OVERLAY.style.display = "none";
      localStorage.setItem("visited", true);
    }, delay);
  } else {
    OVERLAY.style.display = "none";
  }
}

const HEADER = document.querySelector(".header");

window.addEventListener("scroll", handleHeaderVisibility);

let currentScroll;

function handleHeaderVisibility() {
  if (window.scrollY > 100 && window.scrollY > currentScroll) {
    HEADER.style.visibility = "hidden";
  }

  if (window.scrollY > 100 && window.scrollY < currentScroll) {
    HEADER.style.visibility = "visible";
  }
  currentScroll = window.scrollY;
}

let apiUrl = new URL("https://68d037faec1a5ff33826c70e.mockapi.io/movies");

async function handleGetData() {
  let cache = localStorage.getItem("movies");

  if (!cache || (cache && (!updated || isEditing))) {
    try {
      let response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Error occured, response is not ok!!!");
      }
      let data = await response.json();
      moviesList = [...data];
      localStorage.setItem("movies", JSON.stringify(data));
    } catch (error) {
      console.log(`Error ${error} occured!!!`);
    }
  } else {
    moviesList = JSON.parse(localStorage.getItem("movies"));
  }
  updated = true;
  renderedMovies = [...moviesList];
  handleSort();
  handleFilterState();
}

const FORM = document.getElementById("movieForm");

FORM.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isEditing) {
    await handlePutFetch(event);
    FORM[6].textContent = "Add Movie";
    await handleGetData();
    handleMessages(event);
    FORM.reset();
    handleMessages(event);
    isEditing = false;
    return;
  }

  handleMessages(event);
  await handlePostFetch(event);
  handleMessages(event);
});

async function handlePostFetch(event) {
  let postData = handleFormData(event);
  try {
    let response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error("Failed to post");
    updated = false;
    await handleGetData();
  } catch (error) {
    console.log(error + "occured");
  }
}

async function handlePutFetch(event) {
  let postData = handleFormData(event);
  try {
    let response = await fetch(apiUrl + "/" + putId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error("Failed to put");
  } catch (error) {
    console.log(error + "occured");
  }
}

async function handleDelete(id) {
  try {
    let response = await fetch(apiUrl + "/" + id, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to DELETE");
  } catch (error) {
    console.log(error + "occured");
  }
  moviesList = moviesList.filter((movie) => movie.id !== id);
  localStorage.setItem("movies", JSON.stringify(moviesList));
}

function handleFormData(event) {
  event.preventDefault();
  let formData = new FormData(FORM);
  let postData = Object.fromEntries(formData.entries());
  postData.id = Number(postData.id);
  postData.rating = parseFloat(postData.rating);
  FORM.reset();
  return postData;
}

function handleMessages(event) {
  let active = OVERLAY.style.display === "flex";
  let message = "";
  if (!active) {
    if (event.type == "click") {
      message = "Movie deleted";
    } else {
      message = isEditing ? "Movie edited" : "New movie added";
    }
    OVERLAY.innerHTML = `<span>${message} successfully!!!</span>`;
    OVERLAY.style.display = "flex";
  }
  setTimeout(() => {
    OVERLAY.style.display = "none";
  }, 2000);
}

const MOVIES_TABLE = document.getElementById("moviesData");

const MOVIE_TEMPLATE = document.getElementById("movie-template");

function renderMovies() {
  MOVIES_TABLE.innerHTML = "";
  renderedMovies.forEach((movie) => {
    const currentMovie = document.importNode(MOVIE_TEMPLATE.content, true);
    currentMovie.querySelector("#movie-row").dataset.id = movie.id;
    currentMovie.querySelector("#title").innerHTML = movie.title;
    currentMovie.querySelector("#desc").innerHTML = movie.description;
    currentMovie.querySelector("#genre").innerHTML = movie.genre;
    currentMovie.querySelector("#date").innerHTML = movie.releaseDate;
    currentMovie.querySelector("#rating").innerHTML = movie.rating;
    const editBtn = currentMovie.querySelector("#actions>button");
    const deleteBtn = currentMovie.querySelector("#actions>:last-child");
    editBtn.addEventListener("click", (event) => handleMovieEdit(event));
    deleteBtn.addEventListener("click", (event) => handleMovieDelete(event));
    MOVIES_TABLE.appendChild(currentMovie);
  });
}

function handleMovieDelete(event) {
  let movie = event.target.closest("#movie-row");
  let movieId = movie.dataset.id;
  movie.remove();
  handleDelete(movieId);
  handleMessages(event);
}

function handleMovieEdit(event) {
  isEditing = true;
  handlePageScroll();
  let movie = event.target.closest("#movie-row");
  let movieId = movie.dataset.id;
  let movieData = moviesList.find((movie) => movie.id == movieId);
  putId = movieId;
  FORM[1].value = movieData.title;
  FORM[2].value = movieData.description;
  FORM[3].value = movieData.genre;
  FORM[4].value = movieData.releaseDate;
  FORM[5].value = movieData.rating;
  FORM[6].textContent = "Save changes";
}

function handlePageScroll() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}

const SORT_SELECTOR = document.getElementById("sortBy");

SORT_SELECTOR.addEventListener("change", handleSort);

function handleSort() {
  let selectorValue = SORT_SELECTOR.value;
  if (selectorValue === "releaseDate") {
    renderedMovies = renderedMovies.sort((a, b) => {
      const dateA = new Date(a.releaseDate).getTime();
      const dateB = new Date(b.releaseDate).getTime();
      return dateB - dateA;
    });
  } else if (selectorValue === "title") {
    renderedMovies = renderedMovies.sort((a, b) => {
      const titleA = a.title.toUpperCase();
      const titleB = b.title.toUpperCase();
      if (titleA < titleB) {
        return -1;
      } else if (titleA > titleB) {
        return 1;
      }
      return 0;
    });
  } else if (selectorValue === "rating") {
    renderedMovies = renderedMovies.sort((a, b) => {
      return b.rating - a.rating;
    });
  }
  renderMovies();
}

const FILTER_CONTAINER = document.querySelector(".filter");
const GENRE_BTNS = document.querySelectorAll(".genres-tag");

FILTER_CONTAINER.addEventListener("click", (event) => {
  if (event.target.matches(".filter")) {
    return;
  }
  genreFilter(event);
  handleActiveGenreBtn(event);
  handleFilterParams(event);
});

function genreFilter(event) {
  let filter = event.target.dataset.genre;

  if (filter === "all") {
    renderedMovies = moviesList;
  } else {
    renderedMovies = moviesList.filter((movie) => movie.genre.includes(filter));
  }
  handleSort();
  renderMovies();
}

function handleActiveGenreBtn(event) {
  if (event) {
    let target = event.target;
    if (target === FILTER_CONTAINER) return;
    GENRE_BTNS.forEach((btn) => btn.classList.remove("active"));
    target.classList.add("active");
  } else {
    GENRE_BTNS.forEach((btn) => btn.classList.remove("active"));
    target.classList.add("active");
  }
}

const SEARCH_INPUT = document.querySelector(".search-input");

function handleSearch() {
  let input = SEARCH_INPUT.value.toLowerCase();
  renderedMovies = moviesList.filter((movie) =>
    movie.title.toLowerCase().includes(input),
  );
  renderMovies();
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const debounceSearchHandler = debounce(() => handleSearch());

SEARCH_INPUT.addEventListener("input", debounceSearchHandler);

function handleFilterParams(event) {
  let genre = event.target.dataset.genre;
  let param = new URLSearchParams(`genre=${genre}`);
  let url = window.location.pathname + "?" + param;
  window.history.replaceState({}, "", url);
  localStorage.setItem("genre", genre);

  if (genre === "all") {
    window.history.replaceState({}, "", window.location.pathname);
    localStorage.removeItem("genre");
  }
}

function handleFilterState() {
  let genre = localStorage.getItem("genre");
  if (genre) {
    let url = window.location.pathname + "?genre=" + genre;
    window.history.replaceState({}, "", url);
    handleSort();
    renderedMovies = moviesList.filter((movie) => movie.genre.includes(genre));
    renderMovies();
    GENRE_BTNS.forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-genre=${genre}]`).classList.add("active");
  }
}
