export default {
  root: "/",
  search: {
    all: (q) => `/api/search?query=${q}`,
    courses: (q) => `/api/search/courses?query=${q}`,
    units: (q) => `/api/search/units?query=${q}`
  }
}