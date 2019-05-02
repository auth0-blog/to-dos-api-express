// Calculates pagination and returns the meta data
function paginate(perPage, currentPage, total) {
  nextSet = perPage * (currentPage <= 0 ? 1 : currentPage - 1);
  nextPage = nextSet + perPage < total ? currentPage + 1 : null;
  previousPage = nextSet >= perPage ? currentPage - 1 : null;
  return { nextPage, previousPage, currentPage, total, nextSet };
}
module.exports = {
  paginate
};
